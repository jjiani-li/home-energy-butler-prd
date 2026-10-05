import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-incidents-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">异常与接管 — 建设中</p>',
})
export class IncidentsPage {}
