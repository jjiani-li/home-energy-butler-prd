import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-household-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">家庭画像 — 建设中</p>',
})
export class HouseholdPage {}
