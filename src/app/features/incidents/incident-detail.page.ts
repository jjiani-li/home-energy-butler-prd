import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-incidents-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">事故简报 — 建设中</p>',
})
export class IncidentDetailPage {}
