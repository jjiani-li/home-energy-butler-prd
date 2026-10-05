import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ChartSeries {
  readonly key: string;
  readonly label: string;
  readonly color: string; // CSS colour token value
  readonly points: readonly number[];
  readonly kind?: 'line' | 'area' | 'bar' | 'step';
  readonly dashed?: boolean;
}

export interface ChartMarker {
  readonly from: number; // index
  readonly to: number; // index
  readonly label: string;
  readonly tone: 'warn' | 'accent';
}

/**
 * Shared geometry helper. Charts render in a fixed viewBox and scale to the
 * container; strokes use non-scaling-stroke so they stay 1.5px at any width.
 */
function geometry(series: readonly ChartSeries[], height: number) {
  const maxLen = Math.max(1, ...series.map((s) => s.points.length));
  const all = series.flatMap((s) => s.points);
  const max = Math.max(0.0001, ...all);
  const min = Math.min(0, ...all);
  const span = max - min || 1;
  return {
    maxLen,
    max,
    min,
    span,
    x: (i: number) => (i / Math.max(1, maxLen - 1)) * 1000,
    y: (v: number) => height - ((v - min) / span) * (height - 8) - 4,
  };
}

/* ============================================================ Line / area / bar chart */
@Component({
  selector: 'app-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="fig">
      <svg
        class="cv"
        [attr.viewBox]="'0 0 1000 ' + height()"
        [attr.height]="height()"
        preserveAspectRatio="none"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        <!-- horizontal guides -->
        @for (g of guides(); track $index) {
          <line
            [attr.x1]="0"
            [attr.x2]="1000"
            [attr.y1]="g.y"
            [attr.y2]="g.y"
            stroke="var(--line)"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        }

        <!-- highlighted windows -->
        @for (m of markers(); track $index) {
          <rect
            [attr.x]="xAt(m.from)"
            [attr.width]="Math.max(2, xAt(m.to) - xAt(m.from))"
            y="0"
            [attr.height]="height()"
            [attr.fill]="m.tone === 'warn' ? 'var(--warn-soft)' : 'var(--accent-soft)'"
          />
        }

        <!-- series -->
        @for (s of series(); track s.key) {
          @if (s.kind === 'bar') {
            @for (p of s.points; track $index) {
              <rect
                [attr.x]="xAt($index) - barW() / 2"
                [attr.y]="yAt(p)"
                [attr.width]="barW()"
                [attr.height]="Math.max(0, height() - 4 - yAt(p))"
                [attr.fill]="s.color"
              />
            }
          } @else if (s.kind === 'area') {
            <polygon [attr.points]="areaPoints(s)" [attr.fill]="s.color" opacity="0.14" />
            <polyline
              [attr.points]="linePoints(s)"
              fill="none"
              [attr.stroke]="s.color"
              stroke-width="1.5"
              [attr.stroke-dasharray]="s.dashed ? '4 4' : null"
              vector-effect="non-scaling-stroke"
              stroke-linejoin="round"
            />
          } @else {
            <polyline
              [attr.points]="linePoints(s)"
              fill="none"
              [attr.stroke]="s.color"
              stroke-width="1.5"
              [attr.stroke-dasharray]="s.dashed ? '4 4' : null"
              vector-effect="non-scaling-stroke"
              stroke-linejoin="round"
            />
          }
        }
      </svg>

      @if (xLabels().length) {
        <div class="x-axis">
          @for (l of xLabels(); track $index) {
            <span class="t-micro">{{ l }}</span>
          }
        </div>
      }

      @if (showLegend()) {
        <figcaption class="legend">
          @for (s of series(); track s.key) {
            <span class="lg">
              <span class="sw" [style.background]="s.color"></span>
              {{ s.label }}
            </span>
          }
        </figcaption>
      }
    </figure>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .fig {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
      }
      .cv {
        width: 100%;
        display: block;
        overflow: visible;
      }
      .x-axis {
        display: flex;
        justify-content: space-between;
        gap: var(--sp-1);
        color: var(--faint);
      }
      .x-axis span {
        font-size: 10px;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sp-4);
        padding-top: var(--sp-2);
      }
      .lg {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
        color: var(--ink-3);
      }
      .sw {
        width: 12px;
        height: 3px;
        border-radius: 999px;
      }
    `,
  ],
})
export class ChartComponent {
  readonly series = input.required<readonly ChartSeries[]>();
  readonly xLabels = input<readonly string[]>([]);
  readonly height = input<number>(120);
  readonly markers = input<readonly ChartMarker[]>([]);
  readonly ariaLabel = input.required<string>();
  readonly showLegend = input<boolean>(true);
  protected readonly Math = Math;

  private readonly g = computed(() => geometry(this.series(), this.height()));

  readonly guides = computed(() =>
    [0.25, 0.5, 0.75].map((t) => ({ y: 4 + t * (this.height() - 8) })),
  );

  readonly barW = computed(() => Math.max(2, 1000 / Math.max(1, this.g().maxLen) - 1));

  xAt(i: number): number {
    return this.g().x(i);
  }
  yAt(v: number): number {
    return this.g().y(v);
  }

  linePoints(s: ChartSeries): string {
    return s.points.map((p, i) => `${this.g().x(i)},${this.g().y(p)}`).join(' ');
  }

  areaPoints(s: ChartSeries): string {
    const base = this.height() - 4;
    const pts = s.points.map((p, i) => `${this.g().x(i)},${this.g().y(p)}`);
    return `0,${base} ${pts.join(' ')} 1000,${base}`;
  }
}

/* ============================================================ Sparkline */
@Component({
  selector: 'app-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="'0 0 100 ' + h()"
      [attr.height]="h()"
      preserveAspectRatio="none"
      role="img"
      [attr.aria-label]="label()"
    >
      <polygon [attr.points]="area()" [attr.fill]="color()" opacity="0.12" />
      <polyline
        [attr.points]="line()"
        fill="none"
        [attr.stroke]="color()"
        stroke-width="1.5"
        vector-effect="non-scaling-stroke"
        stroke-linejoin="round"
      />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      svg {
        width: 100%;
        display: block;
        overflow: visible;
      }
    `,
  ],
})
export class SparklineComponent {
  readonly points = input.required<readonly number[]>();
  readonly h = input<number>(32);
  readonly color = input<string>('var(--accent)');
  readonly label = input.required<string>();

  private geom() {
    const pts = this.points();
    const max = Math.max(...pts, 0.0001);
    const min = Math.min(...pts, 0);
    const span = max - min || 1;
    const h = this.h();
    return pts.map((v, i) => {
      const x = (i / Math.max(1, pts.length - 1)) * 100;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    });
  }

  readonly line = computed(() => this.geom().join(' '));
  readonly area = computed(() => `0,${this.h()} ${this.geom().join(' ')} 100,${this.h()}`);
}

/* ============================================================ Gauge (single ratio) */
@Component({
  selector: 'app-gauge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gg" role="img" [attr.aria-label]="label() + '：' + percentText()">
      <svg viewBox="0 0 120 66" preserveAspectRatio="xMidYMid meet">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--paper-3)" stroke-width="10" stroke-linecap="butt" />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="10"
          stroke-linecap="butt"
          [attr.stroke-dasharray]="dash()"
        />
      </svg>
      <div class="gg-txt">
        <span class="gg-v">{{ valueText() }}</span>
        <span class="gg-l t-micro">{{ label() }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .gg {
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
        align-items: flex-start;
      }
      svg {
        width: 100%;
        max-width: 200px;
      }
      .gg-txt {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .gg-v {
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
    `,
  ],
})
export class GaugeComponent {
  readonly ratio = input.required<number>();
  readonly valueText = input.required<string>();
  readonly label = input.required<string>();
  readonly color = input<string>('var(--ink)');
  readonly percentText = computed(() => Math.round(this.ratio() * 100) + '%');
  readonly dash = computed(() => {
    const arc = Math.PI * 50;
    const r = Math.min(1, Math.max(0, this.ratio()));
    return `${arc * r} ${arc}`;
  });
}

/* ============================================================ Horizontal bar list */
@Component({
  selector: 'app-bar-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="bl">
      @for (it of items(); track it.label) {
        <li class="bl-i">
          <div class="bl-hd">
            <span class="bl-l">{{ it.label }}</span>
            <span class="bl-v num">{{ it.valueLabel }}</span>
          </div>
          <div class="bar" [class.bar-thin]="true">
            <div
              class="bar-fill"
              [class.bar-fill-accent]="it.sign === 'positive'"
              [class.bar-fill-danger]="it.sign === 'negative'"
              [class.bar-fill-warn]="it.sign === 'warn'"
              [style.width.%]="width(it)"
            ></div>
          </div>
          @if (it.note) {
            <p class="bl-n t-sm c-muted">{{ it.note }}</p>
          }
        </li>
      }
    </ul>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .bl {
        display: flex;
        flex-direction: column;
        gap: var(--sp-4);
      }
      .bl-hd {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--sp-3);
        margin-bottom: 5px;
      }
      .bl-l {
        font-size: var(--fs-sm);
      }
      .bl-v {
        font-size: var(--fs-sm);
        font-weight: 600;
      }
      .bl-n {
        margin: 5px 0 0;
      }
    `,
  ],
})
export class BarListComponent {
  readonly items = input.required<
    readonly {
      label: string;
      valueLabel: string;
      magnitude: number;
      sign: 'positive' | 'negative' | 'warn' | 'neutral';
      note?: string;
    }[]
  >();

  width(it: { magnitude: number }): number {
    const max = Math.max(...this.items().map((i) => Math.abs(i.magnitude)), 0.0001);
    return Math.max(2, (Math.abs(it.magnitude) / max) * 100);
  }
}
