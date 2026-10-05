import {
  BatteryHealth,
  BatteryState,
  EnergyFlow,
  FlexibleLoad,
  Household,
  HouseholdProfile,
  LoadSeries,
  OutageHistory,
  PreferenceWeights,
  RunModeState,
  Site,
  SolarCharacteristic,
  TariffProduct,
  GridFeeRule,
} from '../models';

export const TODAY_ISO = '2026-09-15';
export const TODAY_WEEKDAY = '周二';

export const household: Household = {
  id: 'HH-1042',
  ownerName: 'Familie Brandt',
  address: 'Lindenstraße 24',
  city: 'München',
  country: '德国',
  market: 'DE',
  occupants: 3,
  joinedAt: '2026-04-02',
  installer: 'SolarNord GmbH · 安装商 Anna Weber',
};

export const site: Site = {
  id: 'SITE-88213',
  model: 'SMILE-G3-S10',
  batteryCapacityKwh: 10,
  inverterKw: 8,
  pvKwp: 8.4,
  installedAt: '2025-11-18',
  firmware: 'V1.42.6',
};

export const runMode: RunModeState = {
  mode: 'auto',
  since: '2026-05-06',
  reason: null,
  resumeCondition: null,
  heldBy: null,
  nextPlannedMode: null,
};

/* ------------------------------------------------------------------ 电池实时 */
export const batteryState: BatteryState = {
  soc: 62,
  capacityKwh: 10,
  usableKwh: 6.2,
  backupHoursLeft: 9.4,
  mode: 'solar-priority',
  modeLabel: '正在用屋顶发的电',
  temperatureC: 24.6,
  cellDeltaC: 1.4,
  powerKw: 1.8,
  timestamp: '2026-09-15 14:35',
};

/* ------------------------------------------------------------------ 电池健康 */
function sohSeries(): BatteryHealth['sohSeries'] {
  const months = [
    '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04',
    '2026-05', '2026-06', '2026-07', '2026-08', '2026-09',
  ];
  let v = 100;
  return months.map((m, i) => {
    v -= i === 0 ? 0 : 0.32 + (i % 3) * 0.06;
    return { month: m, value: Math.round(v * 100) / 100 };
  });
}

export const batteryHealth: BatteryHealth = {
  sohPercent: 96.8,
  sohSeries: sohSeries(),
  expectedLifeYears: 12.4,
  totalEfc: 214.6,
  warrantyEfcLimit: 6000,
  degradationPerMonth: 0.34,
  peerComparison: -0.12,
  tempSeries: [
    { hour: '00', value: 22.4 },
    { hour: '02', value: 21.8 },
    { hour: '04', value: 21.2 },
    { hour: '06', value: 21.6 },
    { hour: '08', value: 23.1 },
    { hour: '10', value: 25.4 },
    { hour: '12', value: 27.2 },
    { hour: '14', value: 26.8 },
    { hour: '16', value: 25.6 },
    { hour: '18', value: 24.1 },
    { hour: '20', value: 23.2 },
    { hour: '22', value: 22.6 },
  ],
};

/* ------------------------------------------------------------------ 实时能量流 */
export const energyFlow: EnergyFlow = {
  nodes: [
    {
      key: 'solar',
      label: '屋顶光伏',
      powerKw: 3.2,
      humanReadable: '屋顶正在发电，够眼下全家用',
      direction: 'out',
      stale: false,
    },
    {
      key: 'grid',
      label: '电网',
      powerKw: 0.4,
      humanReadable: '只从电网补一点点',
      direction: 'in',
      stale: false,
    },
    {
      key: 'battery',
      label: '电池',
      powerKw: 1.8,
      humanReadable: '在充电（今天已完成 1.4 次套利动作）',
      direction: 'in',
      stale: false,
    },
    {
      key: 'home',
      label: '家里用电',
      powerKw: 5.4,
      humanReadable: '比平时高一些，洗衣机在跑',
      direction: 'in',
      stale: false,
    },
  ],
  timestamp: '2026-09-15 14:35',
  sourceHealthy: true,
  sourceNote: null,
};

/* ------------------------------------------------------------------ 家庭画像 */
export const householdProfile: HouseholdProfile = {
  learnedDays: 137,
  completeness: 0.86,
  driftDetected: true,
  driftNote: '最近三周晚间基础用电比过去半年高了约 0.4 kW，可能是家里添了新电器。',
  items: [
    {
      id: 'pf-01',
      text: '平日上午 9 点到下午 5 点基本没人在家，这时候只走基础和待机用电。',
      kind: 'fact',
      confidence: 0.96,
      evidence: '过去 137 天里，工作日该时段平均用电 0.31 kW，波动很小。',
      corrected: false,
      correctionText: null,
    },
    {
      id: 'pf-02',
      text: '热水器通常在晚上 21:30 之后启动，每次大约 1 小时半。',
      kind: 'fact',
      confidence: 0.93,
      evidence: '过去 60 天里，有 57 天在 21:30–23:00 出现 2.0–2.4 kW 的负荷台阶。',
      corrected: false,
      correctionText: null,
    },
    {
      id: 'pf-03',
      text: '周三和周日晚上会给电动车充电，大约需要 12 度电。',
      kind: 'fact',
      confidence: 0.89,
      evidence: '每周三、周日 23:00 后出现持续 3–4 小时、约 3.5 kW 的负荷。',
      corrected: false,
      correctionText: null,
    },
    {
      id: 'pf-04',
      text: '你家屋顶冬天下午 3 点后基本发不出电。',
      kind: 'fact',
      confidence: 0.97,
      evidence: '上一冬季（12–2 月）15:00 之后光伏出力平均低于 0.12 kW。',
      corrected: false,
      correctionText: null,
    },
    {
      id: 'pf-05',
      text: '你所在的区域过去一年停电 3 次，都发生在夏季傍晚。',
      kind: 'fact',
      confidence: 0.99,
      evidence: '区域电网公开记录 + 设备侧断电事件日志，两个来源一致。',
      corrected: false,
      correctionText: null,
    },
    {
      id: 'pf-06',
      text: '你周末可能经常外出，白天用电比工作日还低一点。',
      kind: 'guess',
      confidence: 0.62,
      evidence: '近 8 个周末中有 5 个白天用电低于工作日，但没有稳定规律。',
      corrected: false,
      correctionText: null,
    },
    {
      id: 'pf-07',
      text: '你家的洗碗机大概率在晚饭后启动，而且时间不太固定。',
      kind: 'guess',
      confidence: 0.58,
      evidence: '19:30–21:00 之间间歇出现 1.1 kW 的短时负荷，未形成固定模式。',
      corrected: false,
      correctionText: null,
    },
    {
      id: 'pf-08',
      text: '你可能对夜里充电的声音比较敏感。',
      kind: 'guess',
      confidence: 0.41,
      evidence: '没有直接证据，只是两次手动关停夜间充电动作。',
      corrected: true,
      correctionText: '用户回复：不是声音问题，是那两次电价我看不懂，所以先关了。',
    },
  ],
};

/* ------------------------------------------------------------------ 负荷曲线 */
function loadPoints(
  shape: [number, number][],
  pvPeak: number,
  flexibleWindows: { hour: number; kw: number }[],
): LoadSeries['points'] {
  const points: LoadSeries['points'] = [];
  for (let h = 0; h < 24; h++) {
    const hour = String(h).padStart(2, '0') + ':00';
    const baseline = interpolate(shape, h);
    const flex = flexibleWindows
      .filter((w) => w.hour === h)
      .reduce((s, w) => s + w.kw, 0);
    const pv =
      pvPeak > 0 && h >= 7 && h <= 19
        ? Math.max(0, pvPeak * Math.sin(((h - 7) / 12) * Math.PI) * (0.86 + ((h * 7) % 5) / 40))
        : 0;
    points.push({
      hour,
      baselineKw: round2(baseline),
      flexibleKw: round2(flex),
      pvKw: round2(pv),
      totalKw: round2(baseline + flex),
    });
  }
  return points;
}

function interpolate(shape: [number, number][], h: number): number {
  let lo = shape[0];
  let hi = shape[shape.length - 1];
  for (let i = 0; i < shape.length; i++) {
    if (shape[i][0] <= h) lo = shape[i];
    if (shape[i][0] >= h) {
      hi = shape[i];
      break;
    }
  }
  if (lo[0] === hi[0]) return lo[1];
  const t = (h - lo[0]) / (hi[0] - lo[0]);
  return lo[1] + t * (hi[1] - lo[1]);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const loadSeries: LoadSeries[] = [
  {
    key: 'weekday',
    label: '工作日',
    points: loadPoints(
      [
        [0, 0.42], [5, 0.38], [7, 1.35], [9, 0.34], [16, 0.52],
        [18, 1.85], [21, 0.66], [22, 2.24], [23, 3.58], [24, 0.46],
      ],
      4.6,
      [
        { hour: 7, kw: 0.9 },
        { hour: 18, kw: 1.3 },
        { hour: 19, kw: 0.7 },
        { hour: 22, kw: 1.5 },
        { hour: 23, kw: 2.6 },
      ],
    ),
  },
  {
    key: 'weekend',
    label: '周末',
    points: loadPoints(
      [
        [0, 0.48], [6, 0.44], [8, 0.95], [10, 0.82], [14, 0.74],
        [17, 1.15], [19, 2.05], [21, 0.92], [22, 2.10], [23, 3.40], [24, 0.52],
      ],
      4.6,
      [
        { hour: 10, kw: 0.7 },
        { hour: 14, kw: 1.1 },
        { hour: 19, kw: 1.4 },
        { hour: 22, kw: 1.3 },
        { hour: 23, kw: 2.4 },
      ],
    ),
  },
  {
    key: 'holiday',
    label: '假期（长期外出）',
    points: loadPoints(
      [
        [0, 0.22], [8, 0.20], [12, 0.24], [18, 0.26], [23, 0.23], [24, 0.22],
      ],
      4.2,
      [{ hour: 3, kw: 0.15 }],
    ),
  },
];

/* ------------------------------------------------------------------ 大功率设备 */
export const flexibleLoads: FlexibleLoad[] = [
  {
    id: 'fl-01',
    name: '电动车充电桩',
    typicalStart: '周三 / 周日 23:00',
    durationMin: 210,
    energyKwh: 12.0,
    movability: 'movable',
    movabilityLabel: '可以挪 · 幅度大',
    confidence: 0.92,
  },
  {
    id: 'fl-02',
    name: '热水器',
    typicalStart: '每天 21:30',
    durationMin: 90,
    energyKwh: 3.4,
    movability: 'suggest-move',
    movabilityLabel: '建议挪 · 幅度中等',
    confidence: 0.88,
  },
  {
    id: 'fl-03',
    name: '洗衣机',
    typicalStart: '工作日 18:00 前后',
    durationMin: 105,
    energyKwh: 1.9,
    movability: 'movable',
    movabilityLabel: '可以挪 · 幅度中等',
    confidence: 0.74,
  },
  {
    id: 'fl-04',
    name: '烘干机',
    typicalStart: '周末 14:00 前后',
    durationMin: 120,
    energyKwh: 2.6,
    movability: 'movable',
    movabilityLabel: '可以挪 · 幅度大',
    confidence: 0.61,
  },
  {
    id: 'fl-05',
    name: '洗碗机',
    typicalStart: '每天 19:30–21:00',
    durationMin: 135,
    energyKwh: 1.4,
    movability: 'suggest-move',
    movabilityLabel: '建议挪 · 幅度小',
    confidence: 0.55,
  },
  {
    id: 'fl-06',
    name: '热泵（采暖与热水）',
    typicalStart: '全天间歇',
    durationMin: 0,
    energyKwh: 14.2,
    movability: 'fixed',
    movabilityLabel: '不要挪 · 影响舒适度',
    confidence: 0.95,
  },
];

/* ------------------------------------------------------------------ 光伏特征 */
export const solarCharacteristic: SolarCharacteristic = {
  orientation: '主朝向正南偏西 15 度，倾角 32 度',
  tilt: '32 度',
  shading: '东侧有一棵落叶树，10:00 前遮挡约 8%，冬季叶片掉光后遮挡消失',
  seasonal: [
    { season: '春（3–5 月）', kwhPerDay: 26.4 },
    { season: '夏（6–8 月）', kwhPerDay: 34.8 },
    { season: '秋（9–11 月）', kwhPerDay: 19.2 },
    { season: '冬（12–2 月）', kwhPerDay: 7.6 },
  ],
  winterCutoff: '冬季 15:00 之后光伏出力基本低于 0.12 kW',
  cloudyPerformance: '阴天发电约为晴天的 22%，连续阴雨天会低于 15%',
};

/* ------------------------------------------------------------------ 停电画像 */
export const outageHistory: OutageHistory = {
  region: 'München-Sendling 片区',
  eventsLastYear: 3,
  riskNote:
    '你这个片区过去一年停电 3 次，都在夏季傍晚的用电高峰。夏季我会自动把停电备用预留提高一点，秋天再降回来。',
  seasonalRisk: [
    { season: '春', level: 'low' },
    { season: '夏', level: 'high' },
    { season: '秋', level: 'medium' },
    { season: '冬', level: 'medium' },
  ],
  events: [
    {
      date: '2026-07-28',
      startTime: '19:42',
      durationMin: 96,
      cause: '片区变压器过载',
      coveredByBackup: true,
    },
    {
      date: '2026-08-11',
      startTime: '20:15',
      durationMin: 41,
      cause: '上游线路故障',
      coveredByBackup: true,
    },
    {
      date: '2026-08-29',
      startTime: '18:58',
      durationMin: 133,
      cause: '雷雨导致跳闸',
      coveredByBackup: true,
    },
    {
      date: '2026-02-03',
      startTime: '10:20',
      durationMin: 22,
      cause: '计划检修',
      coveredByBackup: false,
    },
  ],
};

/* ------------------------------------------------------------------ 电价产品 */
export const tariffProduct: TariffProduct = {
  name: 'Dynamisch Strom Flex',
  retailer: 'Stadtwerke München',
  mechanism: 'dynamic-15min',
  mechanismLabel: '动态电价 · 每 15 分钟变一次',
  contractUntil: '2027-03-31',
  notes: '零售电价按日前与日内市场价逐刻钟结算，另有月度基础费 €9.90。',
};

export const gridFeeRule: GridFeeRule = {
  tou: true,
  capacity: false,
  demand: false,
  controllableLoadDiscount: true,
  requiresCurtailment: true,
  note:
    '输配电价分时段计价；若接受电网在紧张时段远程限功率，可拿到网费减免。你目前开通了减免档位，代价是电网偶尔会让我降功率。',
};

export const preferenceWeights: PreferenceWeights = {
  savings: 40,
  backup: 40,
  battery: 20,
};
