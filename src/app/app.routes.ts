import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'today' },
  {
    path: 'today',
    title: '今日管家 · 沃太家庭能源管家',
    loadComponent: () => import('./features/today/today.page').then((m) => m.TodayPage),
  },
  {
    path: 'plan',
    title: '能源计划 · 沃太家庭能源管家',
    loadComponent: () => import('./features/plan/plan.page').then((m) => m.PlanPage),
  },
  {
    path: 'decisions',
    title: '决策日志 · 沃太家庭能源管家',
    loadComponent: () => import('./features/decisions/decisions.page').then((m) => m.DecisionsPage),
  },
  {
    path: 'decisions/:id',
    title: '决策详情 · 沃太家庭能源管家',
    loadComponent: () =>
      import('./features/decisions/decision-detail.page').then((m) => m.DecisionDetailPage),
  },
  {
    path: 'household',
    title: '家庭画像 · 沃太家庭能源管家',
    loadComponent: () => import('./features/household/household.page').then((m) => m.HouseholdPage),
  },
  {
    path: 'battery',
    title: '电池与护栏 · 沃太家庭能源管家',
    loadComponent: () => import('./features/battery/battery.page').then((m) => m.BatteryPage),
  },
  {
    path: 'reports',
    title: '收益报告 · 沃太家庭能源管家',
    loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage),
  },
  {
    path: 'incidents',
    title: '异常与接管 · 沃太家庭能源管家',
    loadComponent: () => import('./features/incidents/incidents.page').then((m) => m.IncidentsPage),
  },
  {
    path: 'incidents/:id',
    title: '事故简报 · 沃太家庭能源管家',
    loadComponent: () =>
      import('./features/incidents/incident-detail.page').then((m) => m.IncidentDetailPage),
  },
  {
    path: 'collaborate',
    title: '权限与协作 · 沃太家庭能源管家',
    loadComponent: () =>
      import('./features/collaborate/collaborate.page').then((m) => m.CollaboratePage),
  },
  {
    path: 'review',
    title: '季度策略复核 · 沃太家庭能源管家',
    loadComponent: () => import('./features/review/review.page').then((m) => m.ReviewPage),
  },
  {
    path: 'onboarding',
    title: '冷启动与影子期 · 沃太家庭能源管家',
    loadComponent: () =>
      import('./features/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'markets',
    title: '市场策略包 · 沃太家庭能源管家',
    loadComponent: () => import('./features/markets/markets.page').then((m) => m.MarketsPage),
  },
  {
    path: 'installer',
    title: '安装商视图 · 沃太家庭能源管家',
    loadComponent: () => import('./features/installer/installer.page').then((m) => m.InstallerPage),
  },
  {
    path: 'settings',
    title: '设置 · 沃太家庭能源管家',
    loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: 'today' },
];
