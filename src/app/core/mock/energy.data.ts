import {
  DecisionLog,
  EnergyPlan,
  PlanRevision,
  PricePoint,
  ProfileItem,
} from '../models';
import { gridFeeRule } from './household.data';

/* ==================================================================
   电价曲线 · 2026-09-16（明日）· 15 分钟粒度
   零售电价来自日前 + 日内市场；输配电价按分时计价，是第二条信号。
   ================================================================== */

const RETAIL_BY_HOUR: Record<number, number> = {
  0: 0.108, 1: 0.098, 2: 0.102, 3: 0.112, 4: 0.124, 5: 0.146,
  6: 0.214, 7: 0.318, 8: 0.342, 9: 0.268, 10: 0.196, 11: 0.152,
  12: 0.118, 13: 0.092, 14: 0.098, 15: 0.126, 16: 0.178, 17: 0.272,
  18: 0.336, 19: 0.368, 20: 0.354, 21: 0.286, 22: 0.312, 23: 0.186,
};

function gridFeeAt(hour: number): number {
  if (hour >= 22 || hour < 6) return 0.03;
  if (hour >= 6 && hour < 8) return 0.075;
  if (hour >= 12 && hour < 17) return 0.075;
  if (hour >= 8 && hour < 12) return 0.115;
  return 0.115;
}

export function buildPriceCurve(): PricePoint[] {
  const out: PricePoint[] = [];
  for (let q = 0; q < 96; q++) {
    const h = Math.floor(q / 4);
    const m = (q % 4) * 15;
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    let retail = RETAIL_BY_HOUR[h];
    // 22:00 的 15 分钟尖峰
    if (h === 22 && m === 0) retail = 0.52;
    if (h === 13 && m === 0) retail = 0.081;
    if (h === 8 && m === 30) retail = 0.366;
    const gridFee = gridFeeAt(h);
    out.push({
      time,
      retailEur: round(retail),
      gridFeeEur: gridFee,
      totalEur: round(retail + gridFee),
      isNegative: retail + gridFee < 0,
    });
  }
  return out;
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export const priceCurve: PricePoint[] = buildPriceCurve();

/** 零售电价最便宜的时段，电网费却不是低谷 —— 两条信号方向相反 */
export const OPPOSITE_WINDOWS = ['13:00–13:15', '06:00–06:15', '16:00–16:15'];

export const PRICE_SOURCE = {
  name: 'Stadtwerke München · 动态电价接口（15 分钟粒度）',
  updatedAt: '2026-09-15 16:12',
  confidence: 0.94,
};

/* ==================================================================
   用电量曲线（次日）
   ================================================================== */
export const tomorrowSocCurve = [
  { time: '00:00', value: 28 },
  { time: '01:00', value: 48 },
  { time: '02:00', value: 63 },
  { time: '03:20', value: 74 },
  { time: '07:00', value: 74 },
  { time: '09:00', value: 58 },
  { time: '11:00', value: 71 },
  { time: '13:00', value: 84 },
  { time: '16:00', value: 88 },
  { time: '18:00', value: 74 },
  { time: '21:00', value: 62 },
  { time: '24:00', value: 62 },
];

/* ==================================================================
   明日计划
   ================================================================== */
export const tomorrowPlan: EnergyPlan = {
  date: '2026-09-16',
  weekday: '周三',
  weather: {
    summary: '阴转晴',
    tempC: 17,
    solarForecastKwh: 21.4,
    solarConfidence: 0.81,
  },
  expectedNetEarning: { min: 1.4, likely: 1.86, max: 2.2 },
  baselineEarning: 0.71,
  backupHoursTomorrow: 9.2,
  plannedEfcUsed: 0.42,
  gridFeeIncluded: true,
  locked: false,
  lockedReason: null,
  overriddenBySafety: false,
  overrideNote: null,
  priceSource: PRICE_SOURCE,
  priceCurve,
  socCurve: tomorrowSocCurve,
  slots: [
    {
      id: 'sl-01',
      start: '01:00',
      end: '03:20',
      action: 'grid-charge',
      actionLabel: '从电网充电',
      socFrom: 28,
      socTo: 74,
      powerKw: 3.0,
      backupHoursAfter: 11.2,
      earningEur: -0.62,
      reason:
        '这是今天电价最低的两小时，而且电网费同时也在低谷。先把便宜的存进来，白天就不用买贵的。',
      reasonDetail: [
        {
          q: '为什么是这两个小时，不是更晚一点？',
          a: '凌晨 1 点到 3 点 20 分，电价加上电网费合计约每度 0.13 元，是全天最低的一段。再往后电价从 5 点开始爬升，到 7 点已经涨到每度 0.43，那时候再充就贵了三倍多。',
        },
        {
          q: '为什么只充到 74%，不充满？',
          a: '再往上充，电池充电会变慢，剩下的空间留给明天白天屋顶发的电更划算。你明天的屋顶预计能发 21 度，充满就没有地方存了。',
        },
        {
          q: '这段时间不充会怎样？',
          a: '早高峰 7 点到 9 点家里要用 4 度左右，那时候的电价是每度 0.43，直接从电网买要多花大约 1.2 元。',
        },
      ],
      status: 'planned',
      statusNote: null,
      adjustedFromLabel: null,
    },
    {
      id: 'sl-02',
      start: '03:20',
      end: '07:00',
      action: 'idle',
      actionLabel: '什么都不做',
      socFrom: 74,
      socTo: 74,
      powerKw: 0,
      backupHoursAfter: 11.2,
      earningEur: 0,
      reason: '没有更便宜的时段了，继续充不划算。电池就停在这里等着用。',
      reasonDetail: [
        {
          q: '这段时间为什么不继续套利？',
          a: '4 点到 6 点电价在往上走，电网费也从 6 点开始进入平段。这时候再买电，净算下来是亏的。',
        },
        {
          q: '会不会错过什么机会？',
          a: '不会。系统一直在盯着电价，如果这段时间出现异常低价，我会重新算一遍。',
        },
      ],
      status: 'planned',
      statusNote: null,
      adjustedFromLabel: null,
    },
    {
      id: 'sl-03',
      start: '07:00',
      end: '09:00',
      action: 'discharge',
      actionLabel: '放电供家里用',
      socFrom: 74,
      socTo: 58,
      powerKw: 2.6,
      backupHoursAfter: 8.6,
      earningEur: 0.88,
      reason:
        '早高峰电价涨到每度 0.43，用电池里的电代替买电，是今天第二划算的一段。',
      reasonDetail: [
        {
          q: '为什么这时候放，而不是等到晚上？',
          a: '早高峰和晚高峰的电价差不多（都在每度 0.43 到 0.48 之间），但晚上你有一个硬约束：停电备用不能低于 9 小时。早放一点，晚高峰才放得动。',
        },
        {
          q: '放掉之后停电了怎么办？',
          a: '放完还剩 58%，按你家的基础用电折算大约够用 8.6 小时。你设的底线是 8 小时，所以这个过程不会低于你的红线。',
        },
        {
          q: '电池会不会累？',
          a: '这一段是 0.16 次等效循环，占你这个月预算的 4% 左右。',
        },
      ],
      status: 'planned',
      statusNote: null,
      adjustedFromLabel: null,
    },
    {
      id: 'sl-04',
      start: '09:00',
      end: '16:00',
      action: 'solar-priority',
      actionLabel: '优先用屋顶发的电',
      socFrom: 58,
      socTo: 88,
      powerKw: 0,
      backupHoursAfter: 12.8,
      earningEur: 1.06,
      reason:
        '白天屋顶预计发 21 度电，自己用掉最划算 —— 卖给电网一度只能拿回 0.07 元，自己用相当于省下 0.36 元。',
      reasonDetail: [
        {
          q: '为什么不上网卖掉？',
          a: '你这边的上网电价只有每度 0.07 元，而自家用电相当于省下每度 0.36 元。卖电不划算，所以我会尽量让屋顶的电留在家里。',
        },
        {
          q: '如果发得比预报多怎么办？',
          a: '多出来的电会先存进电池，存满之后才上网。明天的预报置信度是 81%，我会在早上 10 点再核对一次实际出力。',
        },
        {
          q: '阴天会影响吗？',
          a: '会影响。如果实际发电低于预报的 70%，我会把下午 4 点那一段放电往后推，避免影响到晚上的备用。',
        },
      ],
      status: 'planned',
      statusNote: null,
      adjustedFromLabel: null,
    },
    {
      id: 'sl-05',
      start: '16:00',
      end: '21:00',
      action: 'hold',
      actionLabel: '保留为主，只放一点点',
      socFrom: 88,
      socTo: 62,
      powerKw: 1.4,
      backupHoursAfter: 9.2,
      earningEur: 0.54,
      reason:
        '晚上电价是全天最高的（每度 0.48），但你把停电备用设成了 8 小时，所以我只放到这里就停了。',
      reasonDetail: [
        {
          q: '晚上电价更高，为什么不多放一点？',
          a: '因为再放就会贴近你的备用底线。你设的底线是停电后基础设备能撑 8 小时，多赚的那点钱不值得拿这个去换。',
        },
        {
          q: '如果我想多放一点赚钱呢？',
          a: '可以在「电池与护栏」里把"停电时够用多久"调低。我会告诉你这样改大概能多赚多少、以及风险变成什么样。',
        },
      ],
      status: 'planned',
      statusNote: null,
      adjustedFromLabel: null,
    },
    {
      id: 'sl-06',
      start: '21:00',
      end: '24:00',
      action: 'idle',
      actionLabel: '保持备用，不再套利',
      socFrom: 62,
      socTo: 62,
      powerKw: 0,
      backupHoursAfter: 9.2,
      earningEur: 0,
      reason: '保持停电备用。夜里热水器和电动车要用不少电，电池留着更稳妥。',
      reasonDetail: [
        {
          q: '22 点有一个电价尖峰，为什么不放？',
          a: '看下面"我主动放弃的机会"那一栏，我算给你看。',
        },
        {
          q: '热水器和电动车怎么办？',
          a: '你周三晚上会充电动车，大约 12 度。这部分我从 23 点后的低价时段安排，不占用备用余量。',
        },
      ],
      status: 'planned',
      statusNote: null,
      adjustedFromLabel: null,
    },
  ],
  forgone: [
    {
      id: 'fg-01',
      window: '22:00–22:15（15 分钟价格尖峰）',
      whatWouldHaveEarned: 0.3,
      reasonSkipped:
        '理论上放电能多赚 0.30 元。但你家的热水器每天 21:30 之后会启动，如果把电放掉，它会改用当天最贵的电，反而多花 0.12 元 —— 净下来只多赚 0.18 元。为了这 0.18 元要挪动电池、还要占掉夜里的备用余量，低于我为你设的收益门槛，所以我没有放。',
      reasonKind: 'below-threshold',
      userOverride: false,
    },
    {
      id: 'fg-02',
      window: '13:00–14:00（零售电价全天最低）',
      whatWouldHaveEarned: 0.42,
      reasonSkipped:
        '这段时间的零售电价是全天最低的，看起来很适合充电。但这段时间的输配电费在平段，两项加在一起，每度电比凌晨那两小时还贵 0.03 元。单看电价会误判，把两条曲线合起来看就不划算了，所以我没有在这里充。',
      reasonKind: 'grid-fee-conflict',
      userOverride: false,
    },
    {
      id: 'fg-03',
      window: '18:30–20:30（再放一次电）',
      whatWouldHaveEarned: 0.63,
      reasonSkipped:
        '晚高峰电价是全天的最高峰，再多放一次电理论上能多赚 0.63 元。但这样做会消耗 0.28 次等效循环，你本月剩下的电池寿命预算不够覆盖它，而且会占掉晚上的备用余量。我把它留到下个月再看。',
      reasonKind: 'budget',
      userOverride: false,
    },
  ],
};

/* ==================================================================
   今日计划（部分已执行）
   ================================================================== */
export const todayPlan: EnergyPlan = {
  date: '2026-09-15',
  weekday: '周二',
  weather: {
    summary: '晴',
    tempC: 21,
    solarForecastKwh: 28.6,
    solarConfidence: 0.93,
  },
  expectedNetEarning: { min: 2.1, likely: 2.44, max: 2.72 },
  baselineEarning: 0.94,
  backupHoursTomorrow: 10.1,
  plannedEfcUsed: 0.38,
  gridFeeIncluded: true,
  locked: false,
  lockedReason: null,
  overriddenBySafety: true,
  overrideNote:
    '原计划 12:00–13:00 有一小段放电，但当时片区发出限功率指令，我把这段取消了，改回自用。',
  priceSource: PRICE_SOURCE,
  priceCurve,
  socCurve: [
    { time: '00:00', value: 24 },
    { time: '01:00', value: 46 },
    { time: '03:00', value: 71 },
    { time: '07:00', value: 71 },
    { time: '09:00', value: 55 },
    { time: '12:00', value: 78 },
    { time: '14:35', value: 62 },
    { time: '18:00', value: 68 },
    { time: '21:00', value: 64 },
    { time: '24:00', value: 64 },
  ],
  slots: [
    {
      id: 'td-01',
      start: '01:10',
      end: '03:30',
      action: 'grid-charge',
      actionLabel: '从电网充电',
      socFrom: 24,
      socTo: 71,
      powerKw: 3.0,
      backupHoursAfter: 10.8,
      earningEur: -0.58,
      reason: '全天电价最低的两小时，电网费也在低谷。',
      reasonDetail: [
        { q: '为什么比昨天晚了 10 分钟开始？', a: '昨天 1 点整那一档电价略高一点点，等到 1 点 10 分再开始更划算。' },
      ],
      status: 'executed',
      statusNote: '实际充到 71%，比计划少 0.3 度，因为夜里家里待机用电比预期多一些。',
      adjustedFromLabel: null,
    },
    {
      id: 'td-02',
      start: '07:00',
      end: '09:00',
      action: 'discharge',
      actionLabel: '放电供家里用',
      socFrom: 71,
      socTo: 55,
      powerKw: 2.4,
      backupHoursAfter: 8.3,
      earningEur: 0.84,
      reason: '早高峰电价高，用电池里的电代替买电。',
      reasonDetail: [
        { q: '实际执行和计划一致吗？', a: '一致。实际放电 1.5 度，比计划少 0.1 度，因为早上家里用电比预期少一点。' },
      ],
      status: 'executed',
      statusNote: '实际 55%，符合计划。',
      adjustedFromLabel: null,
    },
    {
      id: 'td-03',
      start: '09:00',
      end: '12:00',
      action: 'solar-priority',
      actionLabel: '优先用屋顶发的电',
      socFrom: 55,
      socTo: 78,
      powerKw: 0,
      backupHoursAfter: 11.8,
      earningEur: 0.68,
      reason: '晴天，屋顶发电充足，自己用掉最划算。',
      reasonDetail: [
        { q: '今天发电和预报差多少？', a: '今天实际发了 27.1 度，预报 28.6 度，差了 5%，在正常范围内。' },
      ],
      status: 'executed',
      statusNote: null,
      adjustedFromLabel: null,
    },
    {
      id: 'td-04',
      start: '12:00',
      end: '13:00',
      action: 'discharge',
      actionLabel: '小幅放电',
      socFrom: 78,
      socTo: 72,
      powerKw: 1.2,
      backupHoursAfter: 10.4,
      earningEur: 0.26,
      reason: '（已取消）原计划在这段时间做一次小幅放电。',
      reasonDetail: [
        {
          q: '为什么取消了？',
          a: '12 点前后片区电网发出限功率指令。电网指令的优先级高于套利，我直接把这一小段取消了，改回自用。这也是你开通网费减免档位的代价。',
        },
      ],
      status: 'overridden',
      statusNote: '被电网限功率指令取消，非经济性原因。',
      adjustedFromLabel: '原计划：78% → 72%',
    },
    {
      id: 'td-05',
      start: '16:00',
      end: '21:00',
      action: 'hold',
      actionLabel: '保留为主，只放一点点',
      socFrom: 78,
      socTo: 64,
      powerKw: 1.2,
      backupHoursAfter: 9.6,
      earningEur: 0.48,
      reason: '晚高峰电价最高，但备电底线是 8 小时，只放到这里。',
      reasonDetail: [
        { q: '这一段还没发生吗？', a: '还没有，现在是 14:35。到时会按这个执行，如果有变化我会提前告诉你。' },
      ],
      status: 'planned',
      statusNote: null,
      adjustedFromLabel: null,
    },
    {
      id: 'td-06',
      start: '21:00',
      end: '24:00',
      action: 'idle',
      actionLabel: '保持备用，不再套利',
      socFrom: 64,
      socTo: 64,
      powerKw: 0,
      backupHoursAfter: 9.6,
      earningEur: 0,
      reason: '夜里热水器和电动车要用电，电池留着更稳妥。',
      reasonDetail: [],
      status: 'planned',
      statusNote: null,
      adjustedFromLabel: null,
    },
  ],
  forgone: [
    {
      id: 'tfg-01',
      window: '12:00–13:00（已取消的放电）',
      whatWouldHaveEarned: 0.26,
      reasonSkipped:
        '这一小段放电被电网的限功率指令取消了。电网指令的优先级高于套利，任何情况下我都不会绕过它。',
      reasonKind: 'grid-fee-conflict',
      userOverride: false,
    },
    {
      id: 'tfg-02',
      window: '22:00–22:15（15 分钟价格尖峰）',
      whatWouldHaveEarned: 0.31,
      reasonSkipped:
        '理论收益 0.31 元，但扣掉热水器改用贵电的 0.13 元之后只剩 0.18 元，低于你的收益门槛，而且会占掉夜间备用余量，所以放弃。',
      reasonKind: 'below-threshold',
      userOverride: false,
    },
  ],
};

/* ==================================================================
   日内修正记录
   ================================================================== */
export const planRevisions: PlanRevision[] = [
  {
    id: 'rv-01',
    at: '2026-09-15 11:58',
    summary: '取消 12:00–13:00 的小幅放电',
    reason: '片区电网发出限功率指令，电网指令优先于套利。',
    earningDeltaEur: -0.26,
    notified: true,
    notifyNote: '这是触碰不到的边界，我按 L2 规则推送给用户，同时在你的安装商后台留了记录。',
  },
  {
    id: 'rv-02',
    at: '2026-09-15 10:12',
    summary: '把下午的光伏自用窗口从 15:30 延长到 16:20',
    reason: '实际云量比预报少，中午发电比预期高 8%。',
    earningDeltaEur: 0.11,
    notified: false,
    notifyNote: '影响小于 0.15 元，属于静默修正，只在日报里提一句。',
  },
  {
    id: 'rv-03',
    at: '2026-09-15 08:44',
    summary: '把早高峰放电结束时间从 09:00 提前到 08:50',
    reason: '实际家庭负荷比预期低，早一点结束更划算。',
    earningDeltaEur: 0.04,
    notified: false,
    notifyNote: '静默修正。',
  },
  {
    id: 'rv-04',
    at: '2026-09-14 19:30',
    summary: '把夜间充电量从 4.6 度降到 4.3 度',
    reason: '气象服务把次日的发电预报从 22 度上调到 28 度，白天够用。',
    earningDeltaEur: 0.09,
    notified: false,
    notifyNote: '静默修正。',
  },
  {
    id: 'rv-05',
    at: '2026-09-13 17:20',
    summary: '提高次日停电备用预留 1 小时',
    reason: '气象台发布强对流预警，这个片区夏季傍晚的停电风险上升。',
    earningDeltaEur: -0.34,
    notified: true,
    notifyNote: '这会明显降低当日收益，按规则必须推送给用户并说明原因。',
  },
];

/* ==================================================================
   决策日志
   ================================================================== */
const evidence = (
  price: string,
  gridFee: string,
  weather: string,
  profile: string,
  battery: string,
  prefs: string,
) => [
  { key: 'price', label: '零售电价', value: price, source: 'Stadtwerke München 动态电价接口', updatedAt: '2026-09-15 16:12' },
  { key: 'gridFee', label: '输配电费', value: gridFee, source: ' Bayernwerk 分时网费规则 v3.1', updatedAt: '2026-09-15 16:12' },
  { key: 'weather', label: '天气与光伏预报', value: weather, source: 'MeteoGroup + 屋顶实测出力', updatedAt: '2026-09-15 16:05' },
  { key: 'profile', label: '家庭用能画像', value: profile, source: '本机采集 · 已学习 137 天', updatedAt: '2026-09-15 14:00' },
  { key: 'battery', label: '电池状态', value: battery, source: 'SMILE-G3-S10 电池管理单元', updatedAt: '2026-09-15 14:35' },
  { key: 'prefs', label: '你的偏好', value: prefs, source: '你设定的偏好与红线', updatedAt: '2026-06-30' },
];

export const decisionLogs: DecisionLog[] = [
  {
    id: 'dc-01',
    date: '2026-09-16',
    timestamp: '2026-09-15 17:32',
    actionSummary:
      '明天凌晨 1:00–3:20 充电，因为这是全天电价最低的两小时、电网费也同时在低谷；预计净收益 €1.86，明早仍留够停电用 9.2 小时。',
    action: 'charge',
    actionLabel: '计划充电',
    earningEur: 1.86,
    level: 'L1',
    explainL2: [
      {
        q: '为什么是这两个小时，不是更晚一点？',
        a: '凌晨 1:00–3:20 电价加电网费合计每度约 €0.13，是全天最低。再往后电价从 5 点开始爬升，7 点已经到每度 €0.43，那时候再充贵了三倍多。',
        evidence: [
          { key: 'price', label: '该时段合价', value: '€0.128–0.142 / 度', source: '电价 + 网费曲线', updatedAt: '2026-09-15 16:12' },
          { key: 'price', label: '早高峰合价', value: '€0.433–0.457 / 度', source: '电价 + 网费曲线', updatedAt: '2026-09-15 16:12' },
        ],
      },
      {
        q: '其他时段为什么不选？',
        a: '13:00 那一段零售电价确实是全天最低（€0.081），但那时候输配电费处于平段，加总每度 €0.156，比凌晨还贵 €0.028。只盯着电价会做错判断。',
        evidence: [
          { key: 'gridFee', label: '13:00 合价', value: '€0.156 / 度', source: '网费分时规则', updatedAt: '2026-09-15 16:12' },
        ],
      },
      {
        q: '我放弃了什么？',
        a: '22:00 有一个 15 分钟的价格尖峰（€0.52）。理论上放电能多赚 €0.30，但你家热水器 21:30 之后会启动，放掉电它就得用最贵的电，反而多花 €0.12。净下来只多赚 €0.18，低于收益门槛，我选择放弃。',
        evidence: [
          { key: 'profile', label: '热水器启动规律', value: '近 60 天有 57 天在 21:30–23:00 启动', source: '本机采集', updatedAt: '2026-09-15 14:00' },
        ],
      },
    ],
    explainL3: [
      { label: '与上周同期相比', agentValue: 1.86, compareValue: 1.62, compareLabel: '上周三实际', unit: '€' },
      { label: '与什么都不做相比', agentValue: 1.86, compareValue: -0.64, compareLabel: '全部从电网买电的差额', unit: '€' },
      { label: '与出厂策略相比', agentValue: 1.86, compareValue: 0.71, compareLabel: '出厂默认策略', unit: '€' },
      { label: '与理论最优相比', agentValue: 1.86, compareValue: 2.19, compareLabel: '事后回看能做到的上限', unit: '€' },
    ],
    evidence: evidence(
      '凌晨最低 €0.098 / 度，晚高峰最高 €0.368 / 度',
      '低谷 €0.030、平段 €0.075、高峰 €0.115',
      '阴转晴，预计发电 21.4 度，置信度 81%',
      '工作日上午 9 点至下午 5 点基础负荷约 0.34 kW',
      '剩余 62%，够基础用电约 9.4 小时',
      '省钱 40% / 备电 40% / 护电池 20%',
    ),
    outcome: null,
    overridden: null,
    takenOver: null,
    uncertaintyDeclared:
      '明天 15:00 之后的光伏预报置信度只有 61%。这一段我采用的是保守安排，如果到时候发电明显偏低，我会在下午 4 点前重新调整。',
  },
  {
    id: 'dc-02',
    date: '2026-09-15',
    timestamp: '2026-09-15 11:58',
    actionSummary:
      '取消了 12:00–13:00 的小幅放电安排，因为片区电网发出了限功率指令。电网指令的优先级高于套利。',
    action: 'degrade',
    actionLabel: '按电网指令取消动作',
    earningEur: -0.26,
    level: 'L1',
    explainL2: [
      {
        q: '为什么取消？',
        a: '11:56 收到 Bayernwerk 的限功率指令，要求在你所在的馈线上降低出力。电网指令的优先级高于套利，我直接取消了这一小段。',
        evidence: [
          { key: 'gridFee', label: '限功率指令', value: '2026-09-15 11:56 收到，持续 90 分钟', source: '电网调度接口', updatedAt: '2026-09-15 11:56' },
        ],
      },
      {
        q: '你开通网费减免的代价是什么？',
        a: '你目前享受着可控负荷的网费减免，代价就是电网在紧张时段可以要求我降低功率。这一年里，这类指令一共触发过 4 次，平均每次影响 €0.22 的收益。',
        evidence: [
          { key: 'gridFee', label: '本年度指令次数', value: '4 次', source: '电网调度接口日志', updatedAt: '2026-09-15 11:56' },
        ],
      },
    ],
    explainL3: [
      { label: '网费减免年度收益', agentValue: 41.6, compareValue: 0, compareLabel: '不开通减免档位', unit: '€' },
      { label: '指令造成的年度损失', agentValue: -0.88, compareValue: 0, compareLabel: '不受指令影响', unit: '€' },
    ],
    evidence: evidence(
      '12:00–13:00 零售电价 €0.118 / 度',
      '同期网费平段 €0.075 / 度',
      '晴天，实际发电高于预报',
      '中午有洗衣机运行',
      '剩余 78%',
      '已开通可控负荷网费减免',
    ),
    outcome: { actualEur: -0.26, predictedEur: -0.26, delta: 0 },
    overridden: null,
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-03',
    date: '2026-09-14',
    timestamp: '2026-09-14 21:15',
    actionSummary: '21:00 之后没有放电，保持停电备用。放弃了 22:00 价格尖峰上约 €0.31 的毛收益。',
    action: 'skip',
    actionLabel: '主动放弃一次套利',
    earningEur: 0,
    level: 'L1',
    explainL2: [
      {
        q: '为什么不赚这个钱？',
        a: '22:00 尖峰时段放电毛收益 €0.31，但热水器会被迫用高价电，多花 €0.13，净剩 €0.18。为了 €0.18 要额外消耗 0.09 次等效循环，还要占掉夜间备用余量，低于你设的收益门槛。',
        evidence: [
          { key: 'prefs', label: '收益门槛', value: '单次动作净收益低于 €0.20 不做', source: '你的偏好设置', updatedAt: '2026-06-30' },
        ],
      },
    ],
    explainL3: [
      { label: '毛收益', agentValue: 0.31, compareValue: 0, compareLabel: '不做', unit: '€' },
      { label: '净收益', agentValue: 0.18, compareValue: 0, compareLabel: '不做', unit: '€' },
    ],
    evidence: evidence(
      '22:00–22:15 尖峰 €0.520 / 度',
      '高峰段 €0.115 / 度',
      '晴，无降水',
      '热水器 21:30 后启动，负荷 2.0–2.4 kW',
      '剩余 64%',
      '收益门槛已设',
    ),
    outcome: { actualEur: 0, predictedEur: 0, delta: 0 },
    overridden: null,
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-04',
    date: '2026-09-13',
    timestamp: '2026-09-13 17:20',
    actionSummary:
      '把次日的停电备用预留提高 1 小时。气象台发布强对流预警，这个片区夏季傍晚的停电风险上升。当日收益因此减少约 €0.34。',
    action: 'revise',
    actionLabel: '主动收紧备用',
    earningEur: -0.34,
    level: 'L1',
    explainL2: [
      {
        q: '为什么主动减少收益？',
        a: '你这个片区过去一年 3 次停电全部发生在夏季傍晚。气象台当天发布了强对流预警，我判断停电的保险价值明显高于多赚 €0.34，所以主动把备用提高了一小时。',
        evidence: [
          { key: 'profile', label: '区域停电记录', value: '过去一年 3 次，集中在 6–8 月傍晚', source: '区域电网公开记录', updatedAt: '2026-09-01' },
        ],
      },
    ],
    explainL3: [
      { label: '当日收益影响', agentValue: -0.34, compareValue: 0, compareLabel: '维持原备用', unit: '€' },
      { label: '当日备电可用时长', agentValue: 10.2, compareValue: 9.2, compareLabel: '原备用', unit: '小时' },
    ],
    evidence: evidence(
      '当晚电价 €0.29–0.37 / 度',
      '高峰段 €0.115 / 度',
      '强对流预警，次日有雷阵雨',
      '夏季傍晚停电风险等级：高',
      '剩余 71%',
      '备电优先权重 40%',
    ),
    outcome: { actualEur: -0.31, predictedEur: -0.34, delta: 0.03 },
    overridden: null,
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-05',
    date: '2026-09-12',
    timestamp: '2026-09-12 23:40',
    actionSummary: '把夜间充电目标从 88% 下调到 74%，把空间留给次日的屋顶发电。',
    action: 'revise',
    actionLabel: '下调充电目标',
    earningEur: 0.22,
    level: 'L1',
    explainL2: [
      {
        q: '为什么不满充？',
        a: '次日预报是晴天，屋顶预计发 27 度电。如果把电池充满，白天的电就没地方存，只能以每度 €0.07 上网卖掉。留出 26% 的空间，相当于把这些电留在家里自己用，每度值 €0.36。',
        evidence: [
          { key: 'price', label: '上网电价', value: '€0.07 / 度', source: 'Stadtwerke München 上网结算', updatedAt: '2026-09-01' },
        ],
      },
    ],
    explainL3: [
      { label: '留出空间的收益', agentValue: 0.22, compareValue: 0, compareLabel: '充满不做调整', unit: '€' },
    ],
    evidence: evidence(
      '夜间 €0.10–0.13 / 度',
      '低谷 €0.030 / 度',
      '晴，次日发电预报 27.1 度',
      '工作日基础负荷 0.34 kW',
      '剩余 41%',
      '最高电量上限未设死',
    ),
    outcome: { actualEur: 0.19, predictedEur: 0.22, delta: -0.03 },
    overridden: null,
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-06',
    date: '2026-09-10',
    timestamp: '2026-09-10 19:48',
    actionSummary: '晚高峰放电到 62% 就停住，因为再放会低于你设的停电备用底线。',
    action: 'discharge',
    actionLabel: '晚高峰放电',
    earningEur: 0.71,
    level: 'L1',
    explainL2: [
      {
        q: '晚上电价最高，为什么不多放？',
        a: '你设的底线是停电后基础设备能撑 8 小时。放到 62% 正好还剩 9.2 小时，再往下就贴近底线了。多赚的那点钱不值得拿你的停电保障去换。',
        evidence: [
          { key: 'prefs', label: '停电备用底线', value: '基础设备 8 小时', source: '你的偏好设置', updatedAt: '2026-06-30' },
        ],
      },
    ],
    explainL3: [
      { label: '实际收益', agentValue: 0.71, compareValue: 1.34, compareLabel: '放到最低电量红线的收益', unit: '€' },
      { label: '备电可用时长', agentValue: 9.2, compareValue: 4.6, compareLabel: '放到最低电量红线', unit: '小时' },
    ],
    evidence: evidence(
      '晚高峰 €0.336–0.368 / 度',
      '高峰 €0.115 / 度',
      '多云转晴',
      '19:30 后洗碗机启动',
      '剩余 88%',
      '备电 8 小时底线',
    ),
    outcome: { actualEur: 0.73, predictedEur: 0.71, delta: 0.02 },
    overridden: null,
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-07',
    date: '2026-09-08',
    timestamp: '2026-09-08 08:12',
    actionSummary: '早高峰的放电被用户手动提前结束。用户选择了"以后都按我说的来"。',
    action: 'discharge',
    actionLabel: '早高峰放电（被用户推翻）',
    earningEur: 0.29,
    level: 'L1',
    explainL2: [
      {
        q: '用户为什么推翻？',
        a: '用户留言："早上 8 点半要开烤箱做早餐，电池放到 58% 我怕不够用。"',
        evidence: [
          { key: 'prefs', label: '用户的说明', value: '担心早餐时段备电不足', source: '用户留言', updatedAt: '2026-09-08 08:12' },
        ],
      },
      {
        q: '我把这条当成了长期规则吗？',
        a: '用户明确选择了"以后都按我说的来"。所以从那天起，工作日的早高峰放电下限从 58% 提高到 68%，并已记入规则变更留痕。',
        evidence: [
          { key: 'prefs', label: '新规则', value: '工作日 07:00–09:00 放电不低于 68%', source: '用户确认的规则变更', updatedAt: '2026-09-08 08:14' },
        ],
      },
    ],
    explainL3: [
      { label: '规则变更后的日均收益', agentValue: 2.21, compareValue: 2.38, compareLabel: '变更前', unit: '€' },
      { label: '规则变更后的备电余量', agentValue: 10.8, compareValue: 9.2, compareLabel: '变更前', unit: '小时' },
    ],
    evidence: evidence(
      '早高峰 €0.318–0.342 / 度',
      '高峰 €0.115 / 度',
      '晴',
      '工作日 08:30 有早餐用能峰值',
      '剩余 71%',
      '用户已修改规则',
    ),
    outcome: { actualEur: 0.29, predictedEur: 0.41, delta: -0.12 },
    overridden: {
      by: '用户本人',
      at: '2026-09-08 08:12',
      reason: '早上 8 点半要开烤箱做早餐，担心备电不够用。',
      scope: 'rule',
    },
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-08',
    date: '2026-09-06',
    timestamp: '2026-09-06 02:30',
    actionSummary: '电池温度偏低，主动把充电功率从 3.0 kW 降到 1.8 kW。',
    action: 'revise',
    actionLabel: '按温度保护降低功率',
    earningEur: -0.08,
    level: 'L1',
    explainL2: [
      {
        q: '为什么要降功率？',
        a: '凌晨电池温度降到 8.4 度，低温下大功率充电对电池不友好。这是系统强制的保护项，我无法关掉它，你也不需要做什么。',
        evidence: [
          { key: 'battery', label: '当时电池温度', value: '8.4 度', source: '电池管理单元', updatedAt: '2026-09-06 02:30' },
        ],
      },
    ],
    explainL3: [
      { label: '按原功率充电的收益', agentValue: 0.42, compareValue: 0.34, compareLabel: '降功率后', unit: '€' },
    ],
    evidence: evidence(
      '凌晨 €0.098–0.112 / 度',
      '低谷 €0.030 / 度',
      '夜间最低气温 5 度',
      '夜间基础负荷 0.38 kW',
      '电池温度 8.4 度',
      '温度保护为系统强制项',
    ),
    outcome: { actualEur: -0.07, predictedEur: -0.08, delta: 0.01 },
    overridden: null,
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-09',
    date: '2026-09-05',
    timestamp: '2026-09-05 15:10',
    actionSummary: '这个时段的电价数据一度拉不到，我暂停了当天的套利安排，改用自发自用。',
    action: 'degrade',
    actionLabel: '数据失效时降级',
    earningEur: -0.94,
    level: 'L2',
    explainL2: [
      {
        q: '发生了什么？',
        a: '15:10 到 16:40，零售商的动态电价接口连续返回错误。我没有用最后一次已知的价格继续调度 —— 用过期价格做决策可能让你亏钱。所以我切回了自发自用加备电优先。',
        evidence: [
          { key: 'price', label: '接口状态', value: '15:10–16:40 连续失败，16:41 恢复', source: '数据源健康监测', updatedAt: '2026-09-05 16:41' },
        ],
      },
      {
        q: '为什么不用最后已知的价格？',
        a: '这是产品的硬规则：数据失效时必须降级，不能用"最后已知值"继续驱动调度。宁可少赚，也不拿猜测当依据。',
        evidence: [
          { key: 'price', label: '降级期间电价', value: '未知', source: '—', updatedAt: '2026-09-05 16:40' },
        ],
      },
    ],
    explainL3: [
      { label: '当日实际收益', agentValue: 1.21, compareValue: 2.15, compareLabel: '数据正常时', unit: '€' },
    ],
    evidence: evidence(
      '数据缺失',
      '高峰 €0.115 / 度',
      '晴，发电正常',
      '下午家中有人',
      '剩余 66%',
      '自动模式',
    ),
    outcome: { actualEur: -0.94, predictedEur: -0.94, delta: 0 },
    overridden: null,
    takenOver: {
      by: '沃太售后 · 值班工程师',
      at: '2026-09-05 16:20',
      note: '确认是零售商侧的接口迁移，已切换到备用数据源，并把这个案例升级为数据源告警规则。',
    },
    uncertaintyDeclared:
      '这个时段的电价我读不到，判断不可靠。我没有编一个理由，而是直接切回了保守策略。',
  },
  {
    id: 'dc-10',
    date: '2026-09-02',
    timestamp: '2026-09-02 09:30',
    actionSummary: '首次为你启用"雨季自动提高停电备用"的机制。',
    action: 'revise',
    actionLabel: '启用季节性备用机制',
    earningEur: -0.18,
    level: 'L2',
    explainL2: [
      {
        q: '这是什么机制？',
        a: '停电的保险价值不是固定的。雨季、极端高温和电网检修期，停电风险会上升，所以备用值得多留一点。这个机制是默认开启的，你不需要记得去改它。',
        evidence: [
          { key: 'profile', label: '季节性风险', value: '夏季高、秋冬中、春季低', source: '区域电网历史记录', updatedAt: '2026-09-01' },
        ],
      },
    ],
    explainL3: [
      { label: '雨季备用', agentValue: 10.2, compareValue: 9.2, compareLabel: '平时备用', unit: '小时' },
    ],
    evidence: evidence(
      '当日电价 €0.15–0.34 / 度',
      '高峰 €0.115 / 度',
      '雷阵雨',
      '夏季停电风险等级：高',
      '剩余 58%',
      '备电权重 40%',
    ),
    outcome: { actualEur: -0.18, predictedEur: -0.18, delta: 0 },
    overridden: null,
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-11',
    date: '2026-08-29',
    timestamp: '2026-08-29 18:58',
    actionSummary: '片区停电期间，电池切换到停电供电，保住了冰箱、照明和网络。',
    action: 'discharge',
    actionLabel: '停电供电',
    earningEur: 0,
    level: 'L3',
    explainL2: [
      {
        q: '发生了什么？',
        a: '18:58 片区跳闸停电，持续时间 133 分钟。你的电池在 0.8 秒内接管了基础设备，冰箱、照明和网络全程没有断。',
        evidence: [
          { key: 'battery', label: '停电时剩余电量', value: '71%（够基础用电约 10.6 小时）', source: '电池管理单元', updatedAt: '2026-08-29 18:58' },
        ],
      },
      {
        q: '这算不算"备电失守"？',
        a: '不算。整个过程剩余电量始终高于你设的底线，停电结束时还剩 48%。这是本产品最不能犯的错，我们把它作为一级护栏指标来盯。',
        evidence: [
          { key: 'battery', label: '停电结束时剩余电量', value: '48%', source: '电池管理单元', updatedAt: '2026-08-29 21:11' },
        ],
      },
    ],
    explainL3: [
      { label: '停电时长', agentValue: 133, compareValue: 0, compareLabel: '无停电', unit: '分钟' },
      { label: '备电最低点', agentValue: 48, compareValue: 0, compareLabel: '备电失守', unit: '%' },
    ],
    evidence: evidence(
      '停电期间电价无关',
      '停电期间网费无关',
      '雷雨，晚间 19:00 前后',
      '家中有人，冰箱与网络在线',
      '停电前剩余 71%',
      '备电 8 小时底线',
    ),
    outcome: { actualEur: 0, predictedEur: 0, delta: 0 },
    overridden: null,
    takenOver: null,
    uncertaintyDeclared: null,
  },
  {
    id: 'dc-12',
    date: '2026-08-24',
    timestamp: '2026-08-24 06:40',
    actionSummary: '电池单体温差升到 3.2 度，我暂停了当天上午的套利动作。',
    action: 'degrade',
    actionLabel: '按电池告警暂停套利',
    earningEur: -0.44,
    level: 'L3',
    explainL2: [
      {
        q: '发生了什么？',
        a: '早上 6:40 电池单体温差升到 3.2 度，超过了 3 度的关注线。这不是故障，但需要观察。我暂停了当天上午的套利动作，避免给电池增加额外负担。',
        evidence: [
          { key: 'battery', label: '单体温差', value: '3.2 度（关注线 3.0 度）', source: '电池管理单元', updatedAt: '2026-08-24 06:40' },
        ],
      },
      {
        q: '后来怎么处理的？',
        a: '温差在当天下午回落到 1.6 度，判断是老化和空调出风位置共同造成的。安装商在 8 月 26 日上门检查并调整了散热通道。',
        evidence: [
          { key: 'battery', label: '处理结果', value: '2026-08-26 安装商上门调整散热通道', source: '安装商工单 #TK-2291', updatedAt: '2026-08-26 15:20' },
        ],
      },
    ],
    explainL3: [
      { label: '当日收益影响', agentValue: -0.44, compareValue: 0, compareLabel: '不暂停', unit: '€' },
      { label: '温差峰值', agentValue: 3.2, compareValue: 1.6, compareLabel: '处理后', unit: '度' },
    ],
    evidence: evidence(
      '上午电价 €0.15–0.32 / 度',
      '高峰 €0.115 / 度',
      '晴，气温 31 度',
      '工作日白天无人在家',
      '单体温差 3.2 度',
      '温度保护为系统强制项',
    ),
    outcome: { actualEur: -0.44, predictedEur: -0.44, delta: 0 },
    overridden: null,
    takenOver: {
      by: 'SolarNord GmbH · Anna Weber',
      at: '2026-08-24 09:15',
      note: '远程确认告警，安排 8 月 26 日上门检查散热通道。',
    },
    uncertaintyDeclared: null,
  },
];
