import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-decisions-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">决策日志 — 建设中</p>',
})
export class DecisionsPage {}
