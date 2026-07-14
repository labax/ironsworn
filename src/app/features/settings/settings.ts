import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  ApplicationBackupImportService,
  ApplicationBackupService,
  type ApplicationBackupImportResult,
  type ApplicationBackupPreview,
  type ApplicationBackupRestoreResult,
  type ApplicationBackupResult,
} from '@app/domain/backup';
import { ApplicationResetService, APPLICATION_OWNED_STORAGE_KEYS } from '@app/domain/reset';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  @ViewChild('resetDialog') private resetDialog?: ElementRef<HTMLElement>;
  @ViewChild('resetButton') private resetButton?: ElementRef<HTMLButtonElement>;

  private readonly backup = inject(ApplicationBackupService);
  private readonly importer = inject(ApplicationBackupImportService);
  private readonly reset = inject(ApplicationResetService);
  private readonly router = inject(Router);
  protected readonly lastBackup = signal<ApplicationBackupResult | null>(null);
  protected readonly importResult = signal<ApplicationBackupImportResult | null>(null);
  protected readonly restoreResult = signal<ApplicationBackupRestoreResult | null>(null);
  protected readonly pendingPreview = signal<ApplicationBackupPreview | null>(null);
  protected readonly resetDialogOpen = signal(false);
  protected readonly resetMessage = signal<string | null>(null);
  protected readonly resetFailedKeys = signal<readonly string[]>([]);
  protected readonly resetStatus = this.reset.status;
  protected readonly registeredResetKeys = APPLICATION_OWNED_STORAGE_KEYS;

  protected exportBackup(): void {
    this.lastBackup.set(this.backup.exportAndDownload());
  }

  protected openResetDialog(): void {
    if (this.resetStatus() === 'resetting') return;
    this.resetMessage.set(null);
    this.resetFailedKeys.set([]);
    this.resetDialogOpen.set(true);
    queueMicrotask(() => this.resetDialog?.nativeElement.focus());
  }

  protected closeResetDialog(): void {
    if (this.resetStatus() === 'resetting') return;
    this.resetDialogOpen.set(false);
    queueMicrotask(() => this.resetButton?.nativeElement.focus());
  }

  protected exportBackupBeforeReset(): void {
    this.exportBackup();
  }

  protected async confirmResetApplication(): Promise<void> {
    if (this.resetStatus() === 'resetting') return;
    this.resetMessage.set('Resetting local Ironsworn data…');
    this.resetFailedKeys.set([]);
    const result = await this.reset.resetApplication();
    if (!result.ok) {
      this.resetMessage.set(result.message);
      this.resetFailedKeys.set(result.failedKeys);
      return;
    }
    this.resetMessage.set('Reset complete. Returning to first-run welcome…');
    this.resetDialogOpen.set(false);
    this.reset.endResetSuppression();
    await this.router.navigateByUrl('/welcome');
  }

  protected onResetDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeResetDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.resetDialog?.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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
