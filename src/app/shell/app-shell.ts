import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppInfoService } from '@app/core/services/app-info.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly appInfo = inject(AppInfoService);

  protected readonly appName = this.appInfo.appName;
  protected readonly versionLabel = computed(() => `v${this.appInfo.version()}`);
}
