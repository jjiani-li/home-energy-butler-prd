/* ==========================================================================
   Butler — core domain models
   Source of truth: docs/prd/00-总PRD-沃太家庭能源管家Butler-v2.0.md §7
   ========================================================================== */

export type RunMode =
  | 'shadow'
  | 'advisory'
  | 'auto'
  | 'conservative'
  | 'safe'
  | 'manual-hold';

export type ApprovalLevel = 'L1' | 'L2' | 'L3';
export type IncidentLevel = 'L0' | 'L1' | 'L2' | 'L3';

export interface Interval {
  readonly min: number;
  readonly likely: number;
  readonly max: number;
}

/* ------------------------------------------------------------------ E29 */
export interface RunModeState {
  readonly mode: RunMode;
  readonly since: string;
  readonly reason: string | null;
  readonly resumeCondition: string | null;
  readonly heldBy: string | null;
  readonly nextPlannedMode: RunMode | null;
}

export const RUN_MODE_META: Record<
  RunMode,
  { label: string; tone: 'neutral' | 'accent' | 'warn' | 'danger'; blurb: string }
> = {
  shadow: {
    label: '影子期',
    tone: 'neutral',
    blurb: '我在学习你家，只看不做。任何建议都不会真的动你的电池。',
  },
  advisory: {
    label: '建议模式',
    tone: 'neutral',
    blurb: '我出计划，你点头我才执行。',
  },
  auto: {
    label: '自动模式',
    tone: 'accent',
    blurb: '我在你划定的红线内自动安排充放电，做事前后都会告诉你。',
  },
  conservative: {
    label: '保守模式',
    tone: 'warn',
    blurb: '我暂停了套利，只保证自发自用和停电备用。',
  },
  safe: {
    label: '安全模式',
    tone: 'danger',
    blurb: '我停止了一切优化，设备回到硬件默认行为。',
  },
  'manual-hold': {
    label: '人工接管中',
    tone: 'danger',
    blurb: '有人正在处理你的事，我在此期间不执行任何动作。',
  },
};

/* ------------------------------------------------------------------ E01/E02 */
export interface Household {
  readonly id: string;
  readonly ownerName: string;
  readonly address: string;
  readonly city: string;
  readonly country: string;
  readonly market: string;
  readonly occupants: number;
  readonly joinedAt: string;
  readonly installer: string;
}

export interface Site {
  readonly id: string;
  readonly model: string;
  readonly batteryCapacityKwh: number;
  readonly inverterKw: number;
  readonly pvKwp: number;
  readonly installedAt: string;
  readonly firmware: string;
}

/* ------------------------------------------------------------------ E03 */
export interface BatteryState {
  readonly soc: number;
  readonly capacityKwh: number;
  readonly usableKwh: number;
  readonly backupHoursLeft: number;
  readonly mode: 'charging' | 'discharging' | 'idle' | 'solar-priority';
  readonly modeLabel: string;
  readonly temperatureC: number;
  readonly cellDeltaC: number;
  readonly powerKw: number;
  readonly timestamp: string;
}

/* ------------------------------------------------------------------ E04 */
export interface BatteryHealthPoint {
  readonly month: string;
  readonly value: number;
}

export interface BatteryHealth {
  readonly sohPercent: number;
  readonly sohSeries: BatteryHealthPoint[];
  readonly expectedLifeYears: number;
  readonly totalEfc: number;
  readonly warrantyEfcLimit: number;
  readonly degradationPerMonth: number;
  readonly peerComparison: number;
  readonly tempSeries: { readonly hour: string; readonly value: number }[];
}

/* ------------------------------------------------------------------ E05 */
export interface EnergyFlowNode {
  readonly key: 'solar' | 'grid' | 'battery' | 'home';
  readonly label: string;
  readonly powerKw: number;
  readonly humanReadable: string;
  readonly direction: 'in' | 'out' | 'idle';
  readonly stale: boolean;
}

export interface EnergyFlow {
  readonly nodes: EnergyFlowNode[];
  readonly timestamp: string;
  readonly sourceHealthy: boolean;
  readonly sourceNote: string | null;
}

/* ------------------------------------------------------------------ E07/E06 */
export interface ProfileItem {
  readonly id: string;
  readonly text: string;
  readonly kind: 'fact' | 'guess';
  readonly confidence: number;
  readonly evidence: string;
  readonly corrected: boolean;
  readonly correctionText: string | null;
}

export interface HouseholdProfile {
  readonly learnedDays: number;
  readonly completeness: number;
  readonly items: ProfileItem[];
  readonly driftDetected: boolean;
  readonly driftNote: string | null;
}

/* ------------------------------------------------------------------ E08 */
export interface LoadSeriesPoint {
  readonly hour: string;
  readonly baselineKw: number;
  readonly flexibleKw: number;
  readonly pvKw: number;
  readonly totalKw: number;
}

export interface LoadSeries {
  readonly key: 'weekday' | 'weekend' | 'holiday';
  readonly label: string;
  readonly points: LoadSeriesPoint[];
}

/* ------------------------------------------------------------------ E09 */
export interface FlexibleLoad {
  readonly id: string;
  readonly name: string;
  readonly typicalStart: string;
  readonly durationMin: number;
  readonly energyKwh: number;
  readonly movability: 'movable' | 'suggest-move' | 'fixed';
  readonly movabilityLabel: string;
  readonly confidence: number;
}

/* ------------------------------------------------------------------ E10 */
export interface SolarCharacteristic {
  readonly orientation: string;
  readonly tilt: string;
  readonly shading: string;
  readonly seasonal: { readonly season: string; readonly kwhPerDay: number }[];
  readonly winterCutoff: string;
  readonly cloudyPerformance: string;
}

/* ------------------------------------------------------------------ E11 */
export interface OutageEvent {
  readonly date: string;
  readonly startTime: string;
  readonly durationMin: number;
  readonly cause: string;
  readonly coveredByBackup: boolean;
}

export interface OutageHistory {
  readonly region: string;
  readonly eventsLastYear: number;
  readonly events: OutageEvent[];
  readonly riskNote: string;
  readonly seasonalRisk: { readonly season: string; readonly level: 'low' | 'medium' | 'high' }[];
}

/* ------------------------------------------------------------------ E12/E13/E14 */
export type TariffMechanism = 'fixed' | 'tou' | 'dynamic-hourly' | 'dynamic-15min' | 'tiered';

export interface PricePoint {
  readonly time: string;
  readonly retailEur: number;
  readonly gridFeeEur: number;
  readonly totalEur: number;
  readonly isNegative: boolean;
}

export interface TariffProduct {
  readonly name: string;
  readonly retailer: string;
  readonly mechanism: TariffMechanism;
  readonly mechanismLabel: string;
  readonly contractUntil: string;
  readonly notes: string;
}

export interface GridFeeRule {
  readonly tou: boolean;
  readonly capacity: boolean;
  readonly demand: boolean;
  readonly controllableLoadDiscount: boolean;
  readonly requiresCurtailment: boolean;
  readonly note: string;
}

/* ------------------------------------------------------------------ E16/E17/E15 */
export type SlotAction =
  | 'grid-charge'
  | 'discharge'
  | 'idle'
  | 'solar-priority'
  | 'hold';

export type SlotStatus =
  | 'planned'
  | 'executed'
  | 'revised'
  | 'skipped'
  | 'overridden';

export interface ReasonQA {
  readonly q: string;
  readonly a: string;
}

export interface PlanSlot {
  readonly id: string;
  readonly start: string;
  readonly end: string;
  readonly action: SlotAction;
  readonly actionLabel: string;
  readonly socFrom: number;
  readonly socTo: number;
  readonly powerKw: number;
  readonly backupHoursAfter: number;
  readonly earningEur: number;
  readonly reason: string;
  readonly reasonDetail: ReasonQA[];
  readonly status: SlotStatus;
  readonly statusNote: string | null;
  readonly adjustedFromLabel: string | null;
}

export type ForgoneReason =
  | 'below-threshold'
  | 'backup-edge'
  | 'grid-fee-conflict'
  | 'battery-temp'
  | 'budget'
  | 'lock'
  | 'uncertainty'
  | 'outage-protect';

export interface ForgoneOpportunity {
  readonly id: string;
  readonly window: string;
  readonly whatWouldHaveEarned: number;
  readonly reasonSkipped: string;
  readonly reasonKind: ForgoneReason;
  readonly userOverride: boolean;
}

export interface EnergyPlan {
  readonly date: string;
  readonly weekday: string;
  readonly weather: {
    readonly summary: string;
    readonly tempC: number;
    readonly solarForecastKwh: number;
    readonly solarConfidence: number;
  };
  readonly expectedNetEarning: Interval;
  readonly baselineEarning: number;
  readonly backupHoursTomorrow: number;
  readonly plannedEfcUsed: number;
  readonly slots: PlanSlot[];
  readonly forgone: ForgoneOpportunity[];
  readonly locked: boolean;
  readonly lockedReason: string | null;
  readonly overriddenBySafety: boolean;
  readonly overrideNote: string | null;
  readonly gridFeeIncluded: boolean;
  readonly priceSource: {
    readonly name: string;
    readonly updatedAt: string;
    readonly confidence: number;
  };
  readonly priceCurve: PricePoint[];
  readonly socCurve: { readonly time: string; readonly value: number }[];
}

/* ------------------------------------------------------------------ E19 */
export interface PlanRevision {
  readonly id: string;
  readonly at: string;
  readonly summary: string;
  readonly reason: string;
  readonly earningDeltaEur: number;
  readonly notified: boolean;
  readonly notifyNote: string | null;
}

/* ------------------------------------------------------------------ E18 */
export interface EvidenceRef {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly source: string;
  readonly updatedAt: string;
}

export interface CompareRow {
  readonly label: string;
  readonly agentValue: number;
  readonly compareValue: number;
  readonly compareLabel: string;
  readonly unit: string;
}

export interface DecisionLog {
  readonly id: string;
  readonly date: string;
  readonly timestamp: string;
  readonly actionSummary: string;
  readonly action: 'charge' | 'discharge' | 'idle' | 'skip' | 'degrade' | 'revise';
  readonly actionLabel: string;
  readonly earningEur: number;
  readonly level: ApprovalLevel;
  readonly explainL2: { readonly q: string; readonly a: string; readonly evidence: EvidenceRef[] }[];
  readonly explainL3: CompareRow[];
  readonly evidence: EvidenceRef[];
  readonly outcome: {
    readonly actualEur: number;
    readonly predictedEur: number;
    readonly delta: number;
  } | null;
  readonly overridden: {
    readonly by: string;
    readonly at: string;
    readonly reason: string;
    readonly scope: 'once' | 'rule';
  } | null;
  readonly takenOver: { readonly by: string; readonly at: string; readonly note: string } | null;
  readonly uncertaintyDeclared: string | null;
}

/* ------------------------------------------------------------------ E20/E21 */
export interface Guardrail {
  readonly id: string;
  readonly name: string;
  readonly plainExplanation: string;
  readonly group: 'user' | 'system';
  readonly currentValueLabel: string;
  readonly options: readonly string[];
  readonly level: ApprovalLevel;
  readonly impactOnEarning: string;
  readonly impactOnRisk: string;
  readonly reason: string;
  readonly pendingChange: string | null;
}

export interface GuardrailChange {
  readonly id: string;
  readonly guardrailName: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly status: 'pending' | 'approved' | 'rejected' | 'effective';
  readonly approver: string | null;
  readonly note: string;
}

/* ------------------------------------------------------------------ E22 */
export interface CycleBudget {
  readonly period: 'month' | 'quarter' | 'year';
  readonly periodLabel: string;
  readonly budgetEfc: number;
  readonly usedEfc: number;
  readonly projectedYears: number;
  readonly series: { readonly label: string; readonly used: number }[];
  readonly warningThreshold: number;
}

/* ------------------------------------------------------------------ E23/E24 */
export interface AttributionItem {
  readonly label: string;
  readonly amountEur: number;
  readonly sign: 'positive' | 'negative';
  readonly note: string;
}

export interface EarningsCompareRow {
  readonly label: string;
  readonly billEur: number;
  readonly deltaEur: number | null;
  readonly deltaLabel: string;
  readonly note: string;
  readonly emphasis: boolean;
}

export interface EarningsReport {
  readonly periodLabel: string;
  readonly compare: EarningsCompareRow[];
  readonly attribution: AttributionItem[];
  readonly netEur: number;
  readonly grossEur: number;
  readonly trend: { readonly label: string; readonly netEur: number; readonly deltaVsBaseline: number }[];
  readonly contractCheck: {
    readonly verdict: string;
    readonly evidence: string;
    readonly disclaimer: string;
  };
  readonly assumptions: string[];
}

/* ------------------------------------------------------------------ E25/E26 */
export interface IncidentAction {
  readonly at: string;
  readonly actor: 'agent' | 'user' | 'installer' | 'support';
  readonly actorLabel: string;
  readonly text: string;
}

export interface Incident {
  readonly id: string;
  readonly title: string;
  readonly level: IncidentLevel;
  readonly startedAt: string;
  readonly closedAt: string | null;
  readonly status: 'open' | 'in-progress' | 'closed';
  readonly briefing: {
    readonly what: string;
    readonly why: string;
    readonly whatIDid: string;
    readonly currentState: string;
    readonly suggestion: string;
    readonly whoDecides: 'user' | 'installer' | 'support';
  };
  readonly timeline: IncidentAction[];
  readonly escalation: 'once' | 'systemic' | null;
  readonly impactEur: number | null;
}

/* ------------------------------------------------------------------ E27/E28 */
export interface PendingApproval {
  readonly id: string;
  readonly level: ApprovalLevel;
  readonly title: string;
  readonly proposal: string;
  readonly reason: string;
  readonly impact: string;
  readonly riskIfAccept: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly deadline: string | null;
  readonly origin: 'today' | 'plan' | 'battery' | 'collaborate' | 'markets' | 'installer';
}

export interface AuditEntry {
  readonly id: string;
  readonly at: string;
  readonly actor: string;
  readonly level: ApprovalLevel;
  readonly changed: string;
  readonly why: string;
  readonly scope: string;
}

/* ------------------------------------------------------------------ E31/E32 */
export interface ShadowDay {
  readonly date: string;
  readonly suggestion: string;
  readonly outcome: string;
  readonly deltaEur: number;
  readonly followed: boolean;
}

export interface ShadowPhase {
  readonly startedAt: string;
  readonly endsAt: string;
  readonly daysTotal: number;
  readonly daysDone: number;
  readonly accumulatedIfFollowedEur: number;
  readonly accumulatedDeltaEur: number;
  readonly days: ShadowDay[];
  readonly summaryReady: boolean;
}

export interface ReviewQuestion {
  readonly id: string;
  readonly title: string;
  readonly agentFinding: string;
  readonly evidence: string;
  readonly recommendation: string;
  readonly options: readonly string[];
  readonly currentAnswer: string | null;
}

export interface QuarterlyReview {
  readonly periodLabel: string;
  readonly dueAt: string;
  readonly status: 'not-due' | 'due' | 'in-progress' | 'completed';
  readonly questions: ReviewQuestion[];
  readonly previousPrefs: { readonly savings: number; readonly backup: number; readonly battery: number };
  readonly history: {
    readonly periodLabel: string;
    readonly completedAt: string;
    readonly changeSummary: string[];
  }[];
}

/* ------------------------------------------------------------------ E30 */
export interface MarketPack {
  readonly id: string;
  readonly market: string;
  readonly country: string;
  readonly flagless: string;
  readonly version: string;
  readonly status: 'live' | 'pilot' | 'planned' | 'fused';
  readonly tariffMechanism: TariffMechanism;
  readonly tariffMechanismLabel: string;
  readonly gridFee: GridFeeRule;
  readonly exportRules: {
    readonly allowed: boolean;
    readonly rateEur: number;
    readonly worthwhile: boolean;
    readonly restrictions: string;
  };
  readonly demandResponse: boolean;
  readonly compliance: string[];
  readonly defaultGuardrails: Record<string, string>;
  readonly activeHouseholds: number;
  readonly health: 'healthy' | 'watch' | 'fused';
  readonly ruleChanges: {
    readonly id: string;
    readonly at: string;
    readonly summary: string;
    readonly affectedHouseholds: number;
    readonly reviewTriggered: boolean;
  }[];
}

/* ------------------------------------------------------------------ E33 */
export interface NotificationPrefs {
  readonly pushEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly planPushWindow: string;
  readonly morningDigest: boolean;
  readonly weeklyReport: boolean;
  readonly monthlyReport: boolean;
  readonly quietHours: string;
  readonly maxPushPerWeek: number;
}

export interface NotificationRecord {
  readonly id: string;
  readonly channel: 'push' | 'email' | 'in-app';
  readonly level: 'L1' | 'L2' | 'L3';
  readonly title: string;
  readonly sentAt: string;
  readonly suppressed: boolean;
  readonly suppressedReason: string | null;
}

/* ------------------------------------------------------------------ Prefs */
export interface PreferenceWeights {
  readonly savings: number;
  readonly backup: number;
  readonly battery: number;
}

/* ------------------------------------------------------------------ Installer */
export interface InstallerCustomer {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly capacityKwh: number;
  readonly mode: RunMode;
  readonly alerts7d: number;
  readonly pending: number;
  readonly lastContact: string;
  readonly netEur30d: number;
  readonly deltaVsBaselineEur: number;
  readonly note: string;
}

export interface InstallerTicket {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly source: 'customer-call' | 'system-alert' | 'dealer';
  readonly sourceLabel: string;
  readonly subject: string;
  readonly status: 'open' | 'in-progress' | 'waiting-customer' | 'closed';
  readonly owner: string;
  readonly openedAt: string;
  readonly lastUpdate: string;
  readonly script: string;
}

/* ------------------------------------------------------------------ Cold start */
export interface OnboardingAnswers {
  readonly weights: PreferenceWeights;
  readonly backupNeedHours: number;
  readonly criticalDevices: string[];
  readonly proactivity: 'advisory' | 'auto-notify' | 'auto-quiet';
}

/* ------------------------------------------------------------------ Derived */
export type LoadState = 'ready' | 'loading' | 'empty' | 'degraded' | 'denied';

export interface PageState {
  readonly load: LoadState;
  readonly note: string | null;
}
