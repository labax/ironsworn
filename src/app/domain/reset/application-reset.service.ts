import { Injectable, inject, signal } from '@angular/core';
import { LocalStorageAdapter } from '@app/core/storage';
import { ActiveCharacterService } from '@app/domain/character';
import { OnboardingStateService } from '@app/domain/onboarding';
import { RollHistoryService } from '@app/domain/rolls';
import { ApplicationAutosaveService } from '@app/domain/services/application-autosave.service';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { APPLICATION_OWNED_STORAGE_KEYS } from './application-storage-keys';

export type ApplicationResetStatus = 'idle' | 'resetting' | 'succeeded' | 'failed';
export type ApplicationResetResult =
  | { readonly ok: true; readonly removedKeys: readonly string[] }
  | { readonly ok: false; readonly message: string; readonly failedKeys: readonly string[] };

@Injectable({ providedIn: 'root' })
export class ApplicationResetService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly autosave = inject(ApplicationAutosaveService);
  private readonly activeCharacter = inject(ActiveCharacterService);
  private readonly workspace = inject(CampaignWorkspaceService);
  private readonly rollHistory = inject(RollHistoryService);
  private readonly onboarding = inject(OnboardingStateService);
  private readonly statusState = signal<ApplicationResetStatus>('idle');
  private readonly lastResultState = signal<ApplicationResetResult | null>(null);

  readonly status = this.statusState.asReadonly();
  readonly lastResult = this.lastResultState.asReadonly();
  readonly storageKeys = APPLICATION_OWNED_STORAGE_KEYS;

  endResetSuppression(): void {
    this.autosave.endReset();
  }

  async resetApplication(): Promise<ApplicationResetResult> {
    if (this.statusState() === 'resetting') {
      return {
        ok: false,
        message: 'Reset is already in progress. Wait for it to finish before trying again.',
        failedKeys: [],
      };
    }

    this.statusState.set('resetting');
    this.lastResultState.set(null);
    this.autosave.beginReset();

    try {
      this.clearInMemoryState();
      const failed = new Set<string>();
      const removed: string[] = [];
      for (const registration of APPLICATION_OWNED_STORAGE_KEYS) {
        const result = await this.storage.remove(registration.key);
        if (result.success) removed.push(registration.key);
        else failed.add(registration.key);
      }
      for (const registration of APPLICATION_OWNED_STORAGE_KEYS) {
        if (await this.storage.exists(registration.key)) failed.add(registration.key);
      }
      this.autosave.completeResetToEmptyState();
      if (failed.size > 0) {
        const result: ApplicationResetResult = {
          ok: false,
          message:
            'Reset could not remove every Ironsworn record. Your data was not reported as reset; try again or export a backup before retrying.',
          failedKeys: [...failed],
        };
        this.statusState.set('failed');
        this.lastResultState.set(result);
        return result;
      }
      const result: ApplicationResetResult = { ok: true, removedKeys: removed };
      this.statusState.set('succeeded');
      this.lastResultState.set(result);
      return result;
    } catch {
      const result: ApplicationResetResult = {
        ok: false,
        message: 'Reset failed before completion. No private stored values were logged.',
        failedKeys: APPLICATION_OWNED_STORAGE_KEYS.map((entry) => entry.key),
      };
      this.statusState.set('failed');
      this.lastResultState.set(result);
      return result;
    }
  }

  private clearInMemoryState(): void {
    this.activeCharacter.clearActiveCharacter();
    this.workspace.resetInMemoryState();
    this.rollHistory.clear();
    this.onboarding.resetInMemoryState();
  }
}
