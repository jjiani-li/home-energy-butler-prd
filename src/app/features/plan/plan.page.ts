import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-plan-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">能源计划 — 建设中</p>',
})
export class PlanPage {}
