import { Injectable, inject, signal } from '@angular/core';

import {
  LocalStorageAdapter,
  createSaveEnvelope,
  type LoadResult,
  type SaveResult,
  type StorageError,
} from '@app/core/storage';
import { environment } from '@environments/environment';

import type { RollHistoryEntry } from './roll-history-entry';
import { migrateRollHistoryEntries } from './roll-history.migrations';

export const ROLL_HISTORY_STORAGE_KEY = 'ironsworn.rollHistory';
export type RollHistoryPersistenceStatus = 'idle' | 'saving' | 'saved' | 'failed';

export type RollHistoryLoadResult =
  | {
      readonly success: true;
      readonly found: true;
      readonly entries: readonly RollHistoryEntry[];
      readonly recoveredCount: number;
      readonly discardedCount: number;
    }
  | { readonly success: true; readonly found: false }
  | { readonly success: false; readonly error: StorageError };

@Injectable({ providedIn: 'root' })
export class RollHistoryPersistenceService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly saveStatusState = signal<RollHistoryPersistenceStatus>('idle');
  private readonly loadFailedState = signal(false);
  private readonly lastSaveResultState = signal<SaveResult | null>(null);
  private readonly lastLoadErrorState = signal<StorageError | null>(null);

  readonly saveStatus = this.saveStatusState.asReadonly();
  readonly loadFailed = this.loadFailedState.asReadonly();
  readonly lastSaveResult = this.lastSaveResultState.asReadonly();
  readonly lastLoadError = this.lastLoadErrorState.asReadonly();

  async saveHistory(entries: readonly RollHistoryEntry[]): Promise<SaveResult> {
    this.saveStatusState.set('saving');
    const result = await this.storage.save(
      ROLL_HISTORY_STORAGE_KEY,
      createSaveEnvelope(
        entries.map((entry) => ({ ...entry })),
        {
          appVersion: environment.appVersion,
          metadata: { namespace: ROLL_HISTORY_STORAGE_KEY, contentType: 'roll-history' },
        },
      ),
    );
    this.lastSaveResultState.set(result);
    this.saveStatusState.set(result.success ? 'saved' : 'failed');
    return result;
  }

  async loadHistory(): Promise<RollHistoryLoadResult> {
    const result: LoadResult<unknown> = await this.storage.load(ROLL_HISTORY_STORAGE_KEY);
    if (!result.success) {
      this.loadFailedState.set(true);
      this.lastLoadErrorState.set(result.error);
      return result;
    }
    if (!result.found) return result;

    const migrated = migrateRollHistoryEntries(result.data.payload);
    if (!migrated.ok) {
      const error: StorageError = {
        code: 'malformed-data',
        message: 'Saved roll history data is incomplete or outside supported ranges.',
      };
      this.loadFailedState.set(true);
      this.lastLoadErrorState.set(error);
      return { success: false, error };
    }

    this.loadFailedState.set(false);
    this.lastLoadErrorState.set(null);
    return {
      success: true,
      found: true,
      entries: migrated.entries,
      recoveredCount: migrated.entries.length,
      discardedCount: migrated.discardedCount,
    };
  }
}
