import { Component, inject, signal } from '@angular/core';

import { ApplicationBackupService, type ApplicationBackupResult } from '@app/domain/backup';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: '../placeholder-page.css',
})
export class Settings {
  private readonly backup = inject(ApplicationBackupService);
  protected readonly lastBackup = signal<ApplicationBackupResult | null>(null);

  protected exportBackup(): void {
    this.lastBackup.set(this.backup.exportAndDownload());
  }
}
