import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Swiss-style vector icon set. 24px grid, 1.5px stroke, round caps/joins.
 * Emoji are never used for structural meaning anywhere in this product.
 */
const OPEN =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

const ICONS: Record<string, string> = {
  today: `${OPEN}<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>`,
  calendar: `${OPEN}<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  list: `${OPEN}<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>`,
  book: `${OPEN}<path d="M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z"/><path d="M20 4h-3a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z"/></svg>`,
  home: `${OPEN}<path d="M3 10.6 12 3.5l9 7.1V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
  battery: `${OPEN}<rect x="2" y="7" width="17" height="10" rx="1"/><path d="M22 10.5v3"/><path d="M5 10h6v4H5z"/></svg>`,
  chart: `${OPEN}<path d="M3 21h18"/><path d="M6 21V11M11 21V5M16 21v-7M21 21V9"/></svg>`,
  alert: `${OPEN}<path d="M12 3.6 21 19.5H3z"/><path d="M12 10v4M12 17h.01"/></svg>`,
  users: `${OPEN}<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16.5 5.6a3.2 3.2 0 0 1 0 5.6M18 20a6 6 0 0 0-2.2-4.6"/></svg>`,
  compass: `${OPEN}<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>`,
  globe: `${OPEN}<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/></svg>`,
  wrench: `${OPEN}<path d="M15.4 6.2a4.4 4.4 0 0 0 5.6 5.6l-9.1 9.1a2.6 2.6 0 0 1-3.7-3.7z"/><path d="M15.4 6.2 18 3.6a4.4 4.4 0 0 1 2.9 8.2"/></svg>`,
  sliders: `${OPEN}<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/></svg>`,
  check: `${OPEN}<path d="m4.5 12.5 5 5 10-11"/></svg>`,
  close: `${OPEN}<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>`,
  chevronRight: `${OPEN}<path d="m9 5 7 7-7 7"/></svg>`,
  chevronDown: `${OPEN}<path d="m5 9 7 7 7-7"/></svg>`,
  chevronLeft: `${OPEN}<path d="m15 5-7 7 7 7"/></svg>`,
  arrowRight: `${OPEN}<path d="M4 12h15M13 6l6 6-6 6"/></svg>`,
  arrowDown: `${OPEN}<path d="M12 4v15M6 13l6 6 6-6"/></svg>`,
  arrowUp: `${OPEN}<path d="M12 20V5M6 11l6-6 6 6"/></svg>`,
  lock: `${OPEN}<rect x="4" y="10" width="16" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  unlock: `${OPEN}<rect x="4" y="10" width="16" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 7.6-1.7"/></svg>`,
  info: `${OPEN}<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`,
  clock: `${OPEN}<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/></svg>`,
  bolt: `${OPEN}<path d="M13.5 2 5 13.5h5L9.5 22 19 10.5h-5.4z"/></svg>`,
  leaf: `${OPEN}<path d="M20 4c0 9-5 13-11 13H5c0-9 5-13 11-13z"/><path d="M4 21c1.5-5 4.5-8.5 9-11"/></svg>`,
  shield: `${OPEN}<path d="M12 3l7.5 3v6c0 5-3 8.2-7.5 9.5C7.5 20.2 4.5 17 4.5 12V6z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>`,
  refresh: `${OPEN}<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 4.5V10h-5.4"/></svg>`,
  download: `${OPEN}<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 20h16"/></svg>`,
  plus: `${OPEN}<path d="M12 5v14M5 12h14"/></svg>`,
  minus: `${OPEN}<path d="M5 12h14"/></svg>`,
  filter: `${OPEN}<path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>`,
  thermometer: `${OPEN}<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v6"/></svg>`,
  power: `${OPEN}<path d="M12 3v9"/><path d="M6.8 6.8a7.5 7.5 0 1 0 10.4 0"/></svg>`,
  car: `${OPEN}<path d="M4 16v-3.2L6 8h12l2 4.8V16"/><path d="M4 16h16v3h-3v-1.5H7V19H4z"/><path d="M7 12.5h10"/></svg>`,
  droplet: `${OPEN}<path d="M12 3.5 6.8 10a7 7 0 1 0 10.4 0z"/></svg>`,
  wind: `${OPEN}<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 16h13a3 3 0 1 1-3 3"/><path d="M3 12h7"/></svg>`,
  activity: `${OPEN}<path d="M3 12h4l2.5-7 5 14L17 12h4"/></svg>`,
  eye: `${OPEN}<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
  edit: `${OPEN}<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/></svg>`,
  link: `${OPEN}<path d="M10 13a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7L11.5 6.5"/><path d="M14 11a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7l1.8-1.7"/></svg>`,
  play: `${OPEN}<path d="M7 4.5 19.5 12 7 19.5z"/></svg>`,
  pause: `${OPEN}<path d="M8.5 4.5v15M15.5 4.5v15"/></svg>`,
  layers: `${OPEN}<path d="m12 3 9 4.5-9 4.5-9-4.5z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg>`,
  target: `${OPEN}<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg>`,
  scale: `${OPEN}<path d="M12 3v18M5 7h14"/><path d="M5 7 2.5 13h5z"/><path d="M19 7l-2.5 6h5z"/></svg>`,
  file: `${OPEN}<path d="M6 2.5h7l5 5V21H6z"/><path d="M13 2.5v5h5"/><path d="M9 13h6M9 17h4"/></svg>`,
  search: `${OPEN}<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>`,
  bell: `${OPEN}<path d="M18 16V10a6 6 0 1 0-12 0v6l-1.5 2.5h15z"/><path d="M10 21h4"/></svg>`,
  mail: `${OPEN}<rect x="2.5" y="5" width="19" height="14" rx="1"/><path d="m3 6.5 9 6.5 9-6.5"/></svg>`,
  logout: `${OPEN}<path d="M15 4.5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h9"/><path d="M18 12H9M15 8.5 18.5 12 15 15.5"/></svg>`,
  dot: `${OPEN}<circle cx="12" cy="12" r="3.5"/></svg>`,
  copy: `${OPEN}<rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V4H4v12h4"/></svg>`,
};

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ic" [style.width.px]="size()" [style.height.px]="size()" [innerHTML]="markup()"></span>`,
  styles: [
    `
      :host {
        display: inline-flex;
        flex: none;
        line-height: 0;
      }
      .ic {
        display: block;
      }
      .ic ::ng-deep svg {
        display: block;
      }
    `,
  ],
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly name = input.required<string>();
  readonly size = input<number>(16);

  readonly markup = computed(() => {
    const raw = ICONS[this.name()] ?? ICONS['dot'];
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });
}
