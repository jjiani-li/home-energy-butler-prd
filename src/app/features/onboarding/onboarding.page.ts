import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">冷启动与影子期 — 建设中</p>',
})
export class OnboardingPage {}
