import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">收益报告 — 建设中</p>',
})
export class ReportsPage {}
