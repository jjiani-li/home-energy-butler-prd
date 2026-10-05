import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-battery-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">电池与护栏 — 建设中</p>',
})
export class BatteryPage {}
