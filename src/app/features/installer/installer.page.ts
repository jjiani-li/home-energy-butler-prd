import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-installer-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p class="t-h3">安装商视图 — 建设中</p>',
})
export class InstallerPage {}
