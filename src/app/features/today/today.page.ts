import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButlerStore } from '../../core/store';
import { IconComponent } from '../../shared/icon';
import {
  CardComponent,
  EmptyStateComponent,
  FreshnessComponent,
  ModeBannerComponent,
  PageHeaderComponent,
  SkeletonComponent,
  StatComponent,
} from '../../shared/ui';
import { ChartComponent, ChartMarker, ChartSeries } from '../../shared/charts';
import { EnergyPlan, PlanSlot } from '../../core/models';

interface Track {
  readonly id: string;
  readonly label: string;
  readonly left: number;
  readonly width: number;
  readonly tone: 'charge' | 'discharge' | 'solar' | 'hold' | 'idle';
  readonly status: string;
  readonly slot: PlanSlot;
}

@Component({
  selector: 'app-today-page',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    PageHeaderComponent,
    CardComponent,
    StatComponent,
    ModeBannerComponent,
    SkeletonComponent,
    EmptyStateComponent,
    FreshnessComponent,
    ChartComponent,
  ],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayPage {
  readonly store = inject(ButlerStore);

  readonly plan = computed<EnergyPlan>(() => this.store.todayPlan());
  readonly load = computed(() => this.store.flags().loadState);
  readonly flagged = computed(() => this.load() !== 'ready');

  readonly earning = computed(() => this.plan().expectedNetEarning);
  readonly earningRangeText = computed(() => {
    const e = this.earning();
    return `区间 €${e.min.toFixed(2)} – €${e.max.toFixed(2)}`;
  });
  readonly baselineDelta = computed(() => this.earning().likely - this.plan().baselineEarning);

  readonly netEarningText = computed(() => `€${this.earning().likely.toFixed(2)}`);
  readonly backupText = computed(() => `约 ${this.plan().backupHoursTomorrow.toFixed(1)} 小时`);
  readonly efcText = computed(() => `${this.plan().plannedEfcUsed.toFixed(2)} 次`);
  readonly efcLifeText = computed(() => {
    const pct = (this.plan().plannedEfcUsed / this.store.cycleBudgets[2].budgetEfc) * 100;
    return `约电池寿命的 ${pct.toFixed(2)}%`;
  });

  /** 96 根 15 分钟价格柱：零售电价 + 输配电费 两段叠加，用于暴露"两条信号方向相反" */
  readonly priceSeries = computed<readonly ChartSeries[]>(() => {
    const curve = this.plan().priceCurve;
    return [
      {
        key: 'gridFee',
        label: '输配电费（第二信号）',
        color: 'var(--faint)',
        points: curve.map((p) => p.gridFeeEur * 1000),
        kind: 'bar',
      },
      {
        key: 'retail',
        label: '零售电价',
        color: 'var(--ink)',
        points: curve.map((p) => p.retailEur * 1000),
        kind: 'bar',
      },
    ];
  });

  readonly priceMarkers = computed<readonly ChartMarker[]>(() => {
    if (!this.store.flags().gridFeeConflictHighlight) return [];
    return [
      { from: 48, to: 56, label: '两条信号方向相反', tone: 'warn' },
      { from: 4, to: 12, label: '网费低谷', tone: 'accent' },
    ];
  });

  readonly hourLabels = ['00', '04', '08', '12', '16', '20', '24'];

  readonly socSeries = computed<readonly ChartSeries[]>(() => [
    {
      key: 'soc',
      label: '电池剩余电量（%）',
      color: 'var(--accent)',
      points: this.plan().socCurve.map((p) => p.value),
      kind: 'area',
    },
  ]);

  readonly tracks = computed<readonly Track[]>(() =>
    this.plan().slots.map((s) => {
      const a = minutes(s.start);
      const b = minutes(s.end);
      return {
        id: s.id,
        label: s.actionLabel,
        left: (a / 1440) * 100,
        width: Math.max(1.6, ((b - a) / 1440) * 100),
        tone: toneOf(s),
        status: statusLabel(s),
        slot: s,
      };
    }),
  );

  readonly decisions = computed(() => this.store.decisions().slice(0, 5));
  readonly pending = computed(() => this.store.l2Approvals().slice(0, 1));
  readonly pendingCount = computed(() => this.store.l2Approvals().length);
  readonly nowPct = (14 * 60 + 35) / 1440;

  readonly flowNodes = computed(() => this.store.flow.nodes);

  statusLabel(s: PlanSlot): string {
    return statusLabel(s);
  }

  loadLabel(): string {
    switch (this.load()) {
      case 'loading':
        return '加载中（骨架屏）';
      case 'empty':
        return '空数据';
      case 'degraded':
        return '降级运行';
      case 'denied':
        return '权限不足（L3 人工专属）';
      default:
        return '正常';
    }
  }

  nodeIcon(key: string): string {
    return key === 'solar' ? 'today' : key === 'grid' ? 'power' : key === 'battery' ? 'battery' : 'home';
  }

  reasonLabel(kind: string): string {
    const map: Record<string, string> = {
      'below-threshold': '低于收益门槛',
      'backup-edge': '会触碰停电备用',
      'grid-fee-conflict': '电价与网费方向相反',
      'battery-temp': '电池温度不利',
      budget: '寿命预算不够',
      lock: '当天计划已锁定',
      uncertainty: '预报不确定',
      'outage-protect': '家里有不能断电的设备',
    };
    return map[kind] ?? kind;
  }

  accept(id: string) {
    this.store.resolveApproval(id, 'accept');
  }
  reject(id: string) {
    this.store.resolveApproval(id, 'reject');
  }
  asRule(id: string) {
    this.store.resolveApproval(id, 'rule');
  }
  reload() {
    this.store.setLoadState('ready');
  }
}

function minutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function toneOf(s: PlanSlot): Track['tone'] {
  switch (s.action) {
    case 'grid-charge':
      return 'charge';
    case 'discharge':
      return 'discharge';
    case 'solar-priority':
      return 'solar';
    case 'hold':
      return 'hold';
    default:
      return 'idle';
  }
}

function statusLabel(s: PlanSlot): string {
  switch (s.status) {
    case 'executed':
      return '已执行';
    case 'revised':
      return '已修正';
    case 'skipped':
      return '已放弃';
    case 'overridden':
      return '被电网指令取消';
    default:
      return '待执行';
  }
}
