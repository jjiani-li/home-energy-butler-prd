import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">设置 — 建设中</p>',
})
export class SettingsPage {}
