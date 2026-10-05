import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-review-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">季度策略复核 — 建设中</p>',
})
export class ReviewPage {}
