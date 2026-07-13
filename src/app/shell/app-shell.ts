import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AppInfoService } from '@app/core/services/app-info.service';
import { ApplicationAutosaveService } from '@app/domain/services/application-autosave.service';
import { Navigation } from '@app/shared/navigation/navigation';

@Component({
  selector: 'app-shell',
  imports: [Navigation, RouterLink, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly appInfo = inject(AppInfoService);
  private readonly autosave = inject(ApplicationAutosaveService);

  protected readonly appName = this.appInfo.appName;
  protected readonly versionLabel = computed(() => `v${this.appInfo.version()}`);
  protected readonly showUatBanner = this.appInfo.showUatBanner;
  protected readonly environmentName = this.appInfo.environmentName;
  protected readonly storageMode = this.appInfo.storageMode;
  protected readonly contentMode = this.appInfo.contentMode;
  protected readonly saveStatus = this.autosave.saveStatus;
  protected readonly retrySave = (): void => {
    void this.autosave.retry();
  };
}
