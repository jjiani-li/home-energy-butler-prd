import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButlerStore, Role } from './core/store';
import { IconComponent } from './shared/icon';
import { RUN_MODE_META, RunMode } from './core/models';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly badge?: 'approvals' | 'incidents';
}

interface NavGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly store = inject(ButlerStore);
  readonly navOpen = signal(false);

  readonly nav: readonly NavGroup[] = [
    {
      title: '日常',
      items: [
        { path: '/today', label: '今日管家', icon: 'today' },
        { path: '/plan', label: '能源计划', icon: 'list' },
        { path: '/decisions', label: '决策日志', icon: 'book' },
        { path: '/incidents', label: '异常与接管', icon: 'alert', badge: 'incidents' },
      ],
    },
    {
      title: '我的系统',
      items: [
        { path: '/household', label: '家庭画像', icon: 'home' },
        { path: '/battery', label: '电池与护栏', icon: 'battery' },
        { path: '/reports', label: '收益报告', icon: 'chart' },
      ],
    },
    {
      title: '协作与治理',
      items: [
        { path: '/collaborate', label: '权限与协作', icon: 'users', badge: 'approvals' },
        { path: '/review', label: '季度复核', icon: 'target' },
        { path: '/onboarding', label: '冷启动与影子期', icon: 'compass' },
      ],
    },
    {
      title: '渠道与运营',
      items: [
        { path: '/markets', label: '市场策略包', icon: 'globe' },
        { path: '/installer', label: '安装商视图', icon: 'wrench' },
      ],
    },
    {
      title: '其他',
      items: [{ path: '/settings', label: '设置', icon: 'sliders' }],
    },
  ];

  readonly modeMeta = computed(() => RUN_MODE_META[this.store.runMode().mode]);
  readonly modeTone = computed(() => this.modeMeta().tone);
  readonly approvalCount = computed(
    () => this.store.l2Approvals().length + this.store.l3Approvals().length,
  );
  readonly incidentCount = computed(() => this.store.openIncidents().length);
  readonly modeOptions: { value: RunMode; label: string }[] = [
    { value: 'shadow', label: '影子期' },
    { value: 'advisory', label: '建议模式' },
    { value: 'auto', label: '自动模式' },
    { value: 'conservative', label: '保守模式' },
    { value: 'safe', label: '安全模式' },
    { value: 'manual-hold', label: '人工接管' },
  ];

  badgeFor(kind: 'approvals' | 'incidents' | undefined): number {
    if (kind === 'approvals') return this.approvalCount();
    if (kind === 'incidents') return this.incidentCount();
    return 0;
  }

  setRole(r: Role) {
    this.store.setRole(r);
  }

  setMode(e: Event) {
    const mode = (e.target as HTMLSelectElement).value as RunMode;
    const meta = RUN_MODE_META[mode];
    const reason =
      mode === 'conservative'
        ? '电价数据源暂时不可用，我停止套利，改用最保守的安排。'
        : mode === 'safe'
          ? '电池单体温差超过关注线，我停止了一切优化。'
          : mode === 'manual-hold'
            ? '安装商正在远程诊断你的设备。'
            : null;
    const resume =
      mode === 'conservative'
        ? '数据源恢复后自动回到自动模式'
        : mode === 'safe'
          ? '需要安装商确认后才能恢复'
          : null;
    this.store.setRunMode(mode, reason ?? meta.blurb, resume);
  }

  rollout() {
    this.store.setRunMode(
      'conservative',
      '你要求回到出厂策略，我已停止全部自动调度。历史数据与收益记录不受影响。',
      '你可以在任何时候重新开启管家',
    );
  }

  toggleNav() {
    this.navOpen.update((v) => !v);
  }
}
