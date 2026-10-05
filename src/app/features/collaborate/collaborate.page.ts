import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-collaborate-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">权限与协作 — 建设中</p>',
})
export class CollaboratePage {}
