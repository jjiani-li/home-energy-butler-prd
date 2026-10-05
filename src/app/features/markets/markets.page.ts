import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-markets-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">市场策略包 — 建设中</p>',
})
export class MarketsPage {}
