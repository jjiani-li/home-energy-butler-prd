import { Injectable, computed, signal } from '@angular/core';
import {
  AuditEntry,
  DecisionLog,
  EnergyPlan,
  ForgoneOpportunity,
  Guardrail,
  GuardrailChange,
  Incident,
  IncidentLevel,
  LoadState,
  PendingApproval,
  PreferenceWeights,
  ProfileItem,
  RunMode,
  RUN_MODE_META,
  RunModeState,
} from './models';
import {
  batteryHealth,
  batteryState,
  energyFlow,
  flexibleLoads,
  gridFeeRule,
  household,
  householdProfile,
  loadSeries,
  outageHistory,
  preferenceWeights,
  runMode as initialRunMode,
  site,
  solarCharacteristic,
  tariffProduct,
} from './mock/household.data';
import { decisionLogs, planRevisions, priceCurve, todayPlan, tomorrowPlan } from './mock/energy.data';
import {
  auditEntries,
  cycleBudgets,
  guardrails as seedGuardrails,
  guardrailChanges as seedChanges,
  incidents as seedIncidents,
  installerCustomers,
  installerTickets,
  marketPacks,
  monthlyReport,
  notificationPrefs,
  notifications,
  onboardingAnswers,
  pendingApprovals as seedApprovals,
  quarterlyReport,
  quarterlyReview,
  shadowPhase,
  yearlyReport,
} from './mock/ops.data';

export type Role = 'owner' | 'installer' | 'ops';

export interface DemoFlags {
  /** 强制页面进入某种数据状态，用于原型演示加载 / 空 / 降级 */
  readonly loadState: LoadState;
  readonly shadowMode: boolean;
  readonly gridFeeConflictHighlight: boolean;
  readonly detailDepth: 'plain' | 'deep';
}

@Injectable({ providedIn: 'root' })
export class ButlerStore {
  /* ------------------------------------------------ 静态数据（只读） */
  readonly household = household;
  readonly site = site;
  readonly battery = batteryState;
  readonly health = batteryHealth;
  readonly flow = energyFlow;
  readonly flexibleLoads = flexibleLoads;
  readonly solar = solarCharacteristic;
  readonly outage = outageHistory;
  readonly tariff = tariffProduct;
  readonly gridFee = gridFeeRule;
  readonly loadSeries = loadSeries;
  readonly priceCurve = priceCurve;
  readonly revisions = planRevisions;
  readonly reports = {
    month: monthlyReport,
    quarter: quarterlyReport,
    year: yearlyReport,
  };
  readonly markets = marketPacks;
  readonly customers = installerCustomers;
  readonly tickets = installerTickets;
  readonly notificationPrefs = notificationPrefs;
  readonly notifications = notifications;
  readonly shadowPhase = shadowPhase;
  readonly onboarding = onboardingAnswers;
  readonly review = quarterlyReview;
  readonly auditEntries = auditEntries;
  readonly cycleBudgets = cycleBudgets;

  /* ------------------------------------------------ 可变状态 */
  readonly runMode = signal<RunModeState>(initialRunMode);
  readonly role = signal<Role>('owner');
  readonly profile = signal(householdProfile);
  readonly weights = signal<PreferenceWeights>(preferenceWeights);
  readonly guardrails = signal<Guardrail[]>(seedGuardrails);
  readonly guardrailChanges = signal<GuardrailChange[]>(seedChanges);
  readonly approvals = signal<PendingApproval[]>(seedApprovals);
  readonly incidents = signal<Incident[]>(seedIncidents);
  readonly decisions = signal<DecisionLog[]>(decisionLogs);
  readonly reviewAnswers = signal<Record<string, string | null>>(
    Object.fromEntries(quarterlyReview.questions.map((q) => [q.id, q.currentAnswer])),
  );
  readonly reviewCompletedAt = signal<string | null>(null);

  readonly todayPlan = signal<EnergyPlan>(todayPlan);
  readonly tomorrowPlan = signal<EnergyPlan>(tomorrowPlan);
  readonly planTarget = signal<'today' | 'tomorrow'>('tomorrow');

  readonly flags = signal<DemoFlags>({
    loadState: 'ready',
    shadowMode: false,
    gridFeeConflictHighlight: true,
    detailDepth: 'plain',
  });

  /* ------------------------------------------------ 派生值 */
  readonly modeMeta = computed(() => RUN_MODE_META[this.runMode().mode]);
  readonly activePlan = computed(() =>
    this.planTarget() === 'today' ? this.todayPlan() : this.tomorrowPlan(),
  );
  readonly openApprovals = computed(() =>
    this.approvals().filter((a) => a.origin === 'today' || a.origin === 'plan'),
  );
  readonly l3Approvals = computed(() => this.approvals().filter((a) => a.level === 'L3'));
  readonly l2Approvals = computed(() => this.approvals().filter((a) => a.level === 'L2'));
  readonly openIncidents = computed(() => this.incidents().filter((i) => i.status !== 'closed'));
  readonly userGuardrails = computed(() => this.guardrails().filter((g) => g.group === 'user'));
  readonly systemGuardrails = computed(() => this.guardrails().filter((g) => g.group === 'system'));
  readonly monthBudget = computed(() => this.cycleBudgets.find((b) => b.period === 'month')!);
  readonly budgetUsedRatio = computed(() => {
    const b = this.monthBudget();
    return b.usedEfc / b.budgetEfc;
  });
  readonly backupGuardrail = computed(() =>
    this.guardrails().find((g) => g.id === 'gr-backup')!,
  );
  readonly profileFacts = computed(() => this.profile().items.filter((i) => i.kind === 'fact'));
  readonly profileGuesses = computed(() => this.profile().items.filter((i) => i.kind === 'guess'));
  readonly unconfirmedGuesses = computed(() =>
    this.profileGuesses().filter((i) => !i.corrected),
  );
  readonly todayNetLikely = computed(() => this.todayPlan().expectedNetEarning.likely);
  readonly tomorrowNetLikely = computed(() => this.tomorrowPlan().expectedNetEarning.likely);

  readonly freshTimestamp = computed(() => '2026-09-15 14:35');

  /* ------------------------------------------------ 动作 */
  setRole(role: Role) {
    this.role.set(role);
  }

  setRunMode(mode: RunMode, reason: string | null = null, resumeCondition: string | null = null) {
    this.runMode.set({
      mode,
      since: '2026-09-15 14:35',
      reason,
      resumeCondition,
      heldBy: mode === 'manual-hold' ? '沃太售后 · 值班工程师' : null,
      nextPlannedMode: mode === 'safe' ? 'conservative' : mode === 'conservative' ? 'auto' : null,
    });
  }

  setLoadState(state: LoadState) {
    this.flags.update((f) => ({ ...f, loadState: state }));
  }

  toggleDeepDetail() {
    this.flags.update((f) => ({
      ...f,
      detailDepth: f.detailDepth === 'plain' ? 'deep' : 'plain',
    }));
  }

  toggleGridFeeHighlight() {
    this.flags.update((f) => ({ ...f, gridFeeConflictHighlight: !f.gridFeeConflictHighlight }));
  }

  setShadowMode(on: boolean) {
    this.flags.update((f) => ({ ...f, shadowMode: on }));
    this.setRunMode(on ? 'shadow' : 'auto');
  }

  /** 计划操作：接受 / 锁单 / 解除锁单 / 按老办法来 */
  acceptPlan(target: 'today' | 'tomorrow' = 'tomorrow') {
    this.patchPlan(target, { locked: false });
    this.pushAudit({
      level: 'L1',
      changed: '接受了次日的能源计划',
      why: '用户确认计划内容',
      scope: '仅本户',
    });
  }

  lockPlan(target: 'today' | 'tomorrow', reason: string) {
    this.patchPlan(target, { locked: true, lockedReason: reason });
    this.pushAudit({
      level: 'L2',
      changed: '锁定了当天计划，Agent 不再修改',
      why: reason,
      scope: '仅本户 · 仅当天',
    });
  }

  unlockPlan(target: 'today' | 'tomorrow') {
    this.patchPlan(target, { locked: false, lockedReason: null });
  }

  private patchPlan(target: 'today' | 'tomorrow', patch: Partial<EnergyPlan>) {
    const sig = target === 'today' ? this.todayPlan : this.tomorrowPlan;
    sig.update((p) => ({ ...p, ...patch }));
  }

  /** 用户选择"我要做"这次放弃的机会 */
  overrideForgone(planTarget: 'today' | 'tomorrow', forgoneId: string) {
    const sig = planTarget === 'today' ? this.todayPlan : this.tomorrowPlan;
    sig.update((p) => ({
      ...p,
      forgone: p.forgone.map((f) =>
        f.id === forgoneId ? ({ ...f, userOverride: true } as ForgoneOpportunity) : f,
      ),
    }));
    this.pushAudit({
      level: 'L2',
      changed: '用户要求执行一次原本被放弃的机会',
      why: '用户主动选择',
      scope: '仅本次 · 不修改规则',
    });
  }

  correctProfileItem(itemId: string, correction: string) {
    this.profile.update((p) => ({
      ...p,
      items: p.items.map((i) =>
        i.id === itemId
          ? ({ ...i, corrected: true, correctionText: correction } as ProfileItem)
          : i,
      ),
    }));
  }

  acceptAllProfile() {
    this.profile.update((p) => ({
      ...p,
      driftDetected: false,
      driftNote: null,
      items: p.items.map((i) => (i.kind === 'guess' ? { ...i, corrected: true } : i)),
    }));
  }

  /** 红线变更：提交 L3 审批 */
  requestGuardrailChange(guardrailId: string, toLabel: string, reason: string) {
    const g = this.guardrails().find((x) => x.id === guardrailId);
    if (!g) return;
    this.guardrails.update((list) =>
      list.map((x) => (x.id === guardrailId ? { ...x, pendingChange: toLabel } : x)),
    );
    this.guardrailChanges.update((list) => [
      {
        id: `gc-${list.length + 1}-${Date.now()}`,
        guardrailName: g.name,
        fromLabel: g.currentValueLabel,
        toLabel,
        requestedBy: '用户本人',
        requestedAt: '2026-09-15 14:35',
        status: 'pending',
        approver: null,
        note: reason,
      },
      ...list,
    ]);
    this.pushAudit({
      level: g.level,
      changed: `${g.name}：${g.currentValueLabel} → ${toLabel}`,
      why: reason,
      scope: '仅本户 · 等待审批',
    });
  }

  approveGuardrailChange(id: string, approve: boolean, approver = '护栏复核人 · M. Keller') {
    this.guardrailChanges.update((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, status: approve ? 'effective' : 'rejected', approver }
          : c,
      ),
    );
  }

  resolveApproval(id: string, decision: 'accept' | 'reject' | 'rule') {
    const target = this.approvals().find((a) => a.id === id);
    this.approvals.update((list) => list.filter((a) => a.id !== id));
    if (target) {
      this.pushAudit({
        level: target.level,
        changed:
          decision === 'accept'
            ? `同意：${target.title}`
            : decision === 'reject'
              ? `不同意：${target.title}`
              : `改成长期规则：${target.title}`,
        why:
          decision === 'rule'
            ? '用户选择"以后都按我说的来"，进入规则变更流程'
            : '用户在待确认队列中直接决定',
        scope: decision === 'rule' ? '仅本户 · 长期规则' : '仅本次',
      });
    }
  }

  setReviewAnswer(questionId: string, answer: string) {
    this.reviewAnswers.update((m) => ({ ...m, [questionId]: answer }));
  }

  completeReview() {
    this.reviewCompletedAt.set('2026-09-15 14:35');
  }

  /** 推翻一条决策，并记录"例外还是规则" */
  overrideDecision(id: string, scope: 'once' | 'rule', reason: string) {
    this.decisions.update((list) =>
      list.map((d) =>
        d.id === id
          ? { ...d, overridden: { by: '用户本人', at: '2026-09-15 14:35', reason, scope } }
          : d,
      ),
    );
    this.pushAudit({
      level: scope === 'rule' ? 'L3' : 'L2',
      changed: `推翻了决策 ${id}`,
      why: reason,
      scope: scope === 'rule' ? '仅本户 · 长期规则' : '仅这一次',
    });
  }

  closeIncident(id: string, escalation: 'once' | 'systemic') {
    this.incidents.update((list) =>
      list.map((i) =>
        i.id === id
          ? { ...i, escalation, status: 'closed' as const, closedAt: '2026-09-15 14:35' }
          : i,
      ),
    );
  }

  fuseMarket(marketId: string) {
    this.markets.forEach((m) => void m);
    this.pushAudit({
      level: 'L3',
      changed: `熔断市场 ${marketId} 的自动调度`,
      why: '策略运营判断存在系统性异常，需停用并复核',
      scope: `${marketId} 全部用户`,
    });
  }

  private pushAudit(entry: Omit<AuditEntry, 'id' | 'at' | 'actor'>) {
    this.auditEntries.unshift({
      id: `au-${Date.now()}`,
      at: '2026-09-15 14:35',
      actor: '用户本人',
      ...entry,
    });
  }

  /* ------------------------------------------------ 工具 */
  incidentCountByLevel(level: IncidentLevel): number {
    return this.incidents().filter((i) => i.level === level).length;
  }

  modeLabel(mode: RunMode): string {
    return RUN_MODE_META[mode].label;
  }
}
