import { Component, inject, signal } from '@angular/core';

import {
  ApplicationBackupImportService,
  ApplicationBackupService,
  type ApplicationBackupImportResult,
  type ApplicationBackupPreview,
  type ApplicationBackupRestoreResult,
  type ApplicationBackupResult,
} from '@app/domain/backup';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: '../placeholder-page.css',
})
export class Settings {
  private readonly backup = inject(ApplicationBackupService);
  private readonly importer = inject(ApplicationBackupImportService);
  protected readonly lastBackup = signal<ApplicationBackupResult | null>(null);
  protected readonly importResult = signal<ApplicationBackupImportResult | null>(null);
  protected readonly restoreResult = signal<ApplicationBackupRestoreResult | null>(null);
  protected readonly pendingPreview = signal<ApplicationBackupPreview | null>(null);

  protected exportBackup(): void {
    this.lastBackup.set(this.backup.exportAndDownload());
  }

  protected async selectBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.restoreResult.set(null);
    this.pendingPreview.set(null);
    if (!file) {
      this.importResult.set({
        ok: false,
        stage: 'parse',
        message: 'No file selected. Your current local data was not changed.',
        diagnostics: [],
      });
      return;
    }
    const result = await this.importer.previewFile(file);
    this.importResult.set(result);
    this.pendingPreview.set(result.ok ? result.preview : null);
    input.value = '';
  }

  protected cancelRestore(): void {
    this.pendingPreview.set(null);
    this.restoreResult.set({
      ok: false,
      stage: 'confirmation',
      message: 'Restore canceled. Your current local data was not changed.',
      diagnostics: [],
    });
  }

  protected async confirmRestore(): Promise<void> {
    const preview = this.pendingPreview();
    if (!preview) return;
    const result = await this.importer.restore(preview, true);
    this.restoreResult.set(result);
    if (result.ok) this.pendingPreview.set(null);
  }
}
