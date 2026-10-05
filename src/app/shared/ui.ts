import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from './icon';
import { ButlerStore } from '../core/store';
import { LoadState, RUN_MODE_META, RunMode } from '../core/models';

/* ============================================================ Card */
@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (title()) {
      <header class="card-hd">
        <div class="hd-text">
          <h3>{{ title() }}</h3>
          @if (subtitle()) {
            <p class="t-sm c-muted">{{ subtitle() }}</p>
          }
        </div>
        <div class="hd-actions">
          <ng-content select="[actions]" />
        </div>
      </header>
    }
    <div [class]="bodyClass()">
      <ng-content />
    </div>
    <ng-content select="[footer]" />
  `,
  styles: [
    `
      :host {
        display: block;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--r);
        overflow: hidden;
      }
      :host(.flush) {
        border: 0;
        border-radius: 0;
      }
      .hd-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .hd-text p {
        margin: 0;
      }
      .hd-actions {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        flex: none;
      }
    `,
  ],
})
export class CardComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly padding = input<'normal' | 'tight' | 'none'>('normal');
  readonly bodyClass = computed(() => {
    const p = this.padding();
    return p === 'normal' ? 'card-bd' : p === 'tight' ? 'card-bd-tight' : '';
  });
}

/* ============================================================ Page header */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ph">
      <div class="ph-main">
        @if (kicker()) {
          <p class="t-micro">{{ kicker() }}</p>
        }
        <h1 class="t-h1">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="sub">{{ subtitle() }}</p>
        }
        <ng-content select="[meta]" />
      </div>
      <div class="ph-actions">
        <ng-content select="[actions]" />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ph {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: var(--sp-5);
        flex-wrap: wrap;
        padding-bottom: var(--sp-4);
        border-bottom: 2px solid var(--ink);
        margin-bottom: var(--sp-5);
      }
      .ph-main {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
        max-width: 78ch;
      }
      .ph-main h1 {
        margin: 0;
      }
      .sub {
        margin: 0;
        font-size: var(--fs-body);
        color: var(--muted);
        max-width: 76ch;
      }
      .ph-actions {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        flex-wrap: wrap;
      }
    `,
  ],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly kicker = input<string>('');
}

/* ============================================================ Stat */
@Component({
  selector: 'app-stat',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="st" [class.compact]="compact()">
      <div class="st-top">
        <span class="t-micro">{{ label() }}</span>
        @if (icon()) {
          <app-icon [name]="icon()!" [size]="14" />
        }
      </div>
      <div class="st-val">
        <span class="v" [class.accent]="tone() === 'accent'" [class.warn]="tone() === 'warn'" [class.danger]="tone() === 'danger'">{{ value() }}</span>
        @if (unit()) {
          <span class="u">{{ unit() }}</span>
        }
      </div>
      @if (range()) {
        <p class="t-sm c-muted range">{{ range() }}</p>
      }
      @if (sub()) {
        <p class="t-sm c-muted sub">{{ sub() }}</p>
      }
      @if (delta()) {
        <p class="delta t-sm" [class.pos]="deltaPositive()" [class.neg]="!deltaPositive()">{{ delta() }}</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .st {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .st-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-2);
        color: var(--faint);
      }
      .st-val {
        display: flex;
        align-items: baseline;
        gap: 5px;
      }
      .v {
        font-size: 30px;
        font-weight: 600;
        letter-spacing: -0.03em;
        line-height: 1.05;
      }
      .v.accent {
        color: var(--accent-ink);
      }
      .v.warn {
        color: var(--warn);
      }
      .v.danger {
        color: var(--danger);
      }
      .compact .v {
        font-size: 22px;
      }
      .u {
        font-size: var(--fs-sm);
        color: var(--muted);
        font-weight: 550;
      }
      .range,
      .sub {
        margin: 0;
      }
      .delta {
        margin: 0;
        font-weight: 550;
      }
      .delta.pos {
        color: var(--accent-ink);
      }
      .delta.neg {
        color: var(--danger);
      }
    `,
  ],
})
export class StatComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly unit = input<string>('');
  readonly sub = input<string>('');
  readonly range = input<string>('');
  readonly delta = input<string>('');
  readonly deltaPositive = input<boolean>(true);
  readonly tone = input<'default' | 'accent' | 'warn' | 'danger'>('default');
  readonly icon = input<string>('');
  readonly compact = input<boolean>(false);
}

/* ============================================================ Empty state */
@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="es">
      <div class="es-ic"><app-icon [name]="icon()" [size]="22" /></div>
      <h3 class="t-h3">{{ title() }}</h3>
      <p class="t-sm c-muted">{{ note() }}</p>
      @if (actionLabel()) {
        <button type="button" class="btn btn-sm" (click)="action.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .es {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--sp-3);
        padding: var(--sp-7) var(--sp-5);
      }
      .es-ic {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--muted);
      }
      .es h3,
      .es p {
        margin: 0;
      }
      .es p {
        max-width: 46ch;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly note = input.required<string>();
  readonly icon = input<string>('info');
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}

/* ============================================================ Skeleton */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sk" role="status" aria-live="polite">
      <span class="sr-only">正在载入</span>
      @for (w of widths(); track $index) {
        <div class="shimmer line" [style.width.%]="w" [style.height.px]="height()"></div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sk {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: var(--sp-2) 0;
      }
      .line {
        max-width: 100%;
      }
    `,
  ],
})
export class SkeletonComponent {
  readonly lines = input<number>(3);
  readonly height = input<number>(13);
  readonly widths = computed(() => {
    const base = [92, 74, 86, 62, 78, 55, 88, 68];
    return Array.from({ length: this.lines() }, (_, i) => base[i % base.length]);
  });
}

/* ============================================================ Disclosure */
@Component({
  selector: 'app-disclosure',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dc" [class.open]="open()">
      <button type="button" class="dc-hd" (click)="toggle()" [attr.aria-expanded]="open()">
        <span class="dc-title">
          <app-icon [name]="open() ? 'chevronDown' : 'chevronRight'" [size]="14" />
          <span>{{ title() }}</span>
        </span>
        @if (hint()) {
          <span class="t-sm c-muted hint">{{ hint() }}</span>
        }
      </button>
      @if (open()) {
        <div class="dc-bd">
          <ng-content />
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .dc {
        border-top: 1px solid var(--line);
      }
      .dc-hd {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-4);
        padding: var(--sp-3) 0;
        background: none;
        border: 0;
        cursor: pointer;
        text-align: left;
        font-size: var(--fs-sm);
        font-weight: 550;
      }
      .dc-hd:hover .dc-title {
        color: var(--accent-ink);
      }
      .dc-title {
        display: inline-flex;
        align-items: center;
        gap: var(--sp-2);
      }
      .hint {
        flex: none;
      }
      .dc-bd {
        padding: 0 0 var(--sp-4) var(--sp-5);
      }
    `,
  ],
})
export class DisclosureComponent {
  readonly title = input.required<string>();
  readonly hint = input<string>('');
  readonly startOpen = input<boolean>(false);
  readonly open = signal(false);
  constructor() {
    queueMicrotask(() => this.open.set(this.startOpen()));
  }
  toggle() {
    this.open.update((v) => !v);
  }
}

/* ============================================================ Segmented */
@Component({
  selector: 'app-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sg" role="tablist" [attr.aria-label]="label()">
      @for (o of options(); track o.value) {
        <button
          type="button"
          role="tab"
          class="sg-i"
          [class.on]="o.value === value()"
          [attr.aria-selected]="o.value === value()"
          (click)="value.set(o.value)"
        >
          {{ o.label }}
          @if (o.hint) {
            <span class="t-micro hint">{{ o.hint }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .sg {
        display: inline-flex;
        border: 1px solid var(--line-2);
        border-radius: var(--r);
        overflow: hidden;
        background: var(--paper);
      }
      .sg-i {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 32px;
        padding: 0 var(--sp-3);
        background: transparent;
        border: 0;
        border-right: 1px solid var(--line);
        cursor: pointer;
        font-size: var(--fs-sm);
        font-weight: 550;
        color: var(--ink-3);
        transition: background 140ms var(--ease), color 140ms var(--ease);
      }
      .sg-i:last-child {
        border-right: 0;
      }
      .sg-i:hover {
        background: var(--paper-2);
      }
      .sg-i.on {
        background: var(--ink);
        color: #fff;
      }
      .hint {
        opacity: 0.7;
      }
      .sg-i.on .hint {
        color: #fff;
      }
    `,
  ],
})
export class SegmentedComponent<T extends string = string> {
  readonly options = input.required<{ value: T; label: string; hint?: string }[]>();
  readonly value = model.required<T>();
  readonly label = input<string>('视图切换');
}

/* ============================================================ Toggle */
@Component({
  selector: 'app-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="tg">
      <input type="checkbox" [checked]="checked()" (change)="onChange($event)" />
      <span class="track"><span class="knob"></span></span>
      @if (label()) {
        <span class="txt">{{ label() }}</span>
      }
    </label>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .tg {
        display: inline-flex;
        align-items: center;
        gap: var(--sp-3);
        cursor: pointer;
        min-height: 32px;
      }
      input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .track {
        width: 38px;
        height: 21px;
        border-radius: 999px;
        background: var(--paper-3);
        border: 1px solid var(--line-2);
        position: relative;
        transition: background 160ms var(--ease), border-color 160ms var(--ease);
        flex: none;
      }
      .knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 15px;
        height: 15px;
        border-radius: 999px;
        background: var(--paper);
        border: 1px solid var(--line-2);
        transition: transform 160ms var(--ease), background 160ms var(--ease);
      }
      input:checked + .track {
        background: var(--accent);
        border-color: var(--accent);
      }
      input:checked + .track .knob {
        transform: translateX(17px);
        border-color: transparent;
      }
      input:focus-visible + .track {
        outline: 2px solid var(--ink);
        outline-offset: 2px;
      }
      .txt {
        font-size: var(--fs-sm);
      }
    `,
  ],
})
export class ToggleComponent {
  readonly checked = model.required<boolean>();
  readonly label = input<string>('');
  onChange(e: Event) {
    this.checked.set((e.target as HTMLInputElement).checked);
  }
}

/* ============================================================ Run-mode banner */
@Component({
  selector: 'app-mode-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb" [class]="meta().tone" role="status">
      <div class="mb-l">
        <span class="dot" [class]="'dot-' + toneClass()"></span>
        <span class="t-micro name">{{ meta().label }}</span>
        <span class="blurb">{{ meta().blurb }}</span>
      </div>
      <div class="mb-r">
        @if (state().reason) {
          <span class="t-sm reason">原因：{{ state().reason }}</span>
        }
        @if (state().resumeCondition) {
          <span class="t-sm resume">恢复条件：{{ state().resumeCondition }}</span>
        }
        @if (state().heldBy) {
          <span class="t-sm resume">接管人：{{ state().heldBy }}</span>
        }
        @if (compactActions()) {
          <a class="link link-accent" href="/battery">查看护栏</a>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mb {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-4);
        flex-wrap: wrap;
        padding: var(--sp-3) var(--sp-4);
        border: 1px solid var(--line);
        border-left-width: 3px;
        border-radius: var(--r);
        background: var(--paper);
      }
      .mb.neutral {
        border-left-color: var(--ink-3);
      }
      .mb.accent {
        border-left-color: var(--accent);
        background: var(--accent-soft);
        border-color: var(--accent-line);
      }
      .mb.warn {
        border-left-color: var(--warn);
        background: var(--warn-soft);
        border-color: var(--warn-line);
      }
      .mb.danger {
        border-left-color: var(--danger);
        background: var(--danger-soft);
        border-color: var(--danger-line);
      }
      .mb-l {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        min-width: 0;
        flex-wrap: wrap;
      }
      .mb-r {
        display: flex;
        align-items: center;
        gap: var(--sp-4);
        flex-wrap: wrap;
      }
      .name {
        color: var(--ink);
      }
      .blurb {
        font-size: var(--fs-sm);
        color: var(--ink-2);
      }
      .reason,
      .resume {
        color: var(--ink-2);
      }
    `,
  ],
})
export class ModeBannerComponent {
  private readonly store = inject(ButlerStore);
  readonly state = input(this.store.runMode());
  readonly compactActions = input<boolean>(false);
  readonly meta = computed(() => RUN_MODE_META[this.state().mode]);
  readonly toneClass = computed(() => {
    const t = this.meta().tone;
    return t === 'accent' ? 'accent' : t === 'warn' ? 'warn' : t === 'danger' ? 'danger' : '';
  });
}

/* ============================================================ Page state switcher (prototype control) */
@Component({
  selector: 'app-state-switcher',
  standalone: true,
  imports: [SegmentedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sw">
      <span class="t-micro">原型状态</span>
      <app-segmented
        [options]="opts"
        [value]="store.flags().loadState"
        (valueChange)="store.setLoadState($event)"
        label="数据状态切换"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sw {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        flex-wrap: wrap;
      }
    `,
  ],
})
export class StateSwitcherComponent {
  readonly store = inject(ButlerStore);
  readonly opts: { value: LoadState; label: string }[] = [
    { value: 'ready', label: '正常' },
    { value: 'loading', label: '加载中' },
    { value: 'empty', label: '空数据' },
    { value: 'degraded', label: '降级' },
    { value: 'denied', label: '权限不足' },
  ];
}

/* ============================================================ Freshness */
@Component({
  selector: 'app-freshness',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="fr" [class.stale]="stale()">
      <app-icon name="clock" [size]="13" />
      <span>{{ label() }}</span>
      <span class="src">· {{ source() }}</span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .fr {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
        color: var(--muted);
      }
      .fr.stale {
        color: var(--warn);
      }
      .src {
        color: var(--faint);
      }
    `,
  ],
})
export class FreshnessComponent {
  readonly label = input.required<string>();
  readonly source = input.required<string>();
  readonly stale = input<boolean>(false);
}

/* ============================================================ Section title */
@Component({
  selector: 'app-section-title',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sh">
      <h2 class="t-h2">{{ title() }}</h2>
      @if (note()) {
        <p class="t-sm c-muted">{{ note() }}</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: var(--sp-3);
      }
      .sh {
        display: flex;
        align-items: baseline;
        gap: var(--sp-4);
        flex-wrap: wrap;
      }
      h2,
      p {
        margin: 0;
      }
      p {
        max-width: 72ch;
      }
    `,
  ],
})
export class SectionTitleComponent {
  readonly title = input.required<string>();
  readonly note = input<string>('');
}

/* ============================================================ Level tag */
@Component({
  selector: 'app-level',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="lv" [class]="level()">{{ level() }}</span>`,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .lv {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 26px;
        padding: 1px 6px;
        border: 1px solid var(--line-2);
        border-radius: var(--r);
        font-size: var(--fs-micro);
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--ink-3);
        background: var(--paper-2);
      }
      .lv.L1 {
        border-color: var(--accent-line);
        background: var(--accent-soft);
        color: var(--accent-ink);
      }
      .lv.L2 {
        border-color: var(--warn-line);
        background: var(--warn-soft);
        color: var(--warn);
      }
      .lv.L3 {
        border-color: var(--danger-line);
        background: var(--danger-soft);
        color: var(--danger);
      }
      .lv.L0 {
        opacity: 0.7;
      }
    `,
  ],
})
export class LevelComponent {
  readonly level = input.required<string>();
}
