import { Injectable, inject } from '@angular/core';
import {
  LocalStorageAdapter,
  createSaveEnvelope,
  migrateSaveEnvelope,
  safeParse,
  type StorageError,
} from '@app/core/storage';
import { migratePersistedActiveCharacter } from '@app/domain/character/active-character-persistence.migrations';
import { migrateRollHistoryEntries } from '@app/domain/rolls/roll-history.migrations';
import {
  APPLICATION_STATE_STORAGE_KEY,
  ApplicationAutosaveService,
  type ApplicationStateSnapshot,
} from '@app/domain/services/application-autosave.service';
import type { Character } from '@app/domain/character';
import { migratePersistedCampaignWorkspace } from '@app/domain/services/campaign-workspace-persistence.migrations';
import { environment } from '@environments/environment';

import {
  APPLICATION_BACKUP_FORMAT,
  APPLICATION_BACKUP_FORMAT_VERSION,
  type ApplicationBackupRecordCounts,
} from './application-backup';

export type ApplicationBackupImportStage = 'parse' | 'validate' | 'write' | 'hydrate';

export interface ApplicationBackupPreview {
  readonly exportedAt: string;
  readonly sourceApplicationVersion: string;
  readonly schemaVersion: number;
  readonly migratedSchemaVersion: number;
  readonly counts: ApplicationBackupRecordCounts;
  readonly warnings: readonly string[];
  readonly replacementNotice: string;
  readonly snapshot: ApplicationStateSnapshot;
}

export type ApplicationBackupImportResult =
  | { readonly ok: true; readonly preview: ApplicationBackupPreview }
  | {
      readonly ok: false;
      readonly stage: ApplicationBackupImportStage;
      readonly message: string;
      readonly diagnostics: readonly string[];
    };

export type ApplicationBackupRestoreResult =
  | {
      readonly ok: true;
      readonly counts: ApplicationBackupRecordCounts;
      readonly warnings: readonly string[];
    }
  | {
      readonly ok: false;
      readonly stage: 'confirmation' | 'write' | 'hydrate';
      readonly message: string;
      readonly diagnostics: readonly string[];
      readonly error?: StorageError;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const countSnapshot = (snapshot: ApplicationStateSnapshot): ApplicationBackupRecordCounts => ({
  characters: snapshot.character ? 1 : 0,
  progressTracks: snapshot.workspace?.progressTracks.length ?? 0,
  vows: snapshot.workspace?.vows.length ?? 0,
  rollHistoryEntries: snapshot.rollHistory?.length ?? 0,
  journalEntries: snapshot.workspace?.journalEntries?.length ?? 0,
  customOracleTables: snapshot.workspace?.customOracleTables?.length ?? 0,
});

@Injectable({ providedIn: 'root' })
export class ApplicationBackupImportService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly autosave = inject(ApplicationAutosaveService);

  previewJson(rawJson: string): ApplicationBackupImportResult {
    const parsed = safeParse<unknown>(rawJson);
    if (!parsed.success)
      return this.reject(
        'parse',
        'That file is not valid JSON. Choose a backup exported by this app.',
        ['Backup JSON could not be parsed.'],
      );
    return this.previewDocument(parsed.value);
  }

  async previewFile(file: File): Promise<ApplicationBackupImportResult> {
    return this.previewJson(await file.text());
  }

  async restore(
    preview: ApplicationBackupPreview,
    confirmed: boolean,
  ): Promise<ApplicationBackupRestoreResult> {
    if (!confirmed) {
      return {
        ok: false,
        stage: 'confirmation',
        message: 'Restore canceled. Your current local data was not changed.',
        diagnostics: [],
      };
    }

    const previous = this.autosave.createSnapshot();
    const restored = {
      ...cloneJson(preview.snapshot),
      revision: Math.max(this.autosave.revision(), preview.snapshot.revision) + 1,
    };
    const envelope = createSaveEnvelope(restored, {
      appVersion: environment.appVersion,
      metadata: {
        namespace: APPLICATION_STATE_STORAGE_KEY,
        contentType: 'application-state',
        revision: restored.revision,
        restoredFrom: APPLICATION_BACKUP_FORMAT,
      },
    });
    const write = await this.storage.save(APPLICATION_STATE_STORAGE_KEY, envelope);
    if (!write.success)
      return {
        ok: false,
        stage: 'write',
        message: 'Restore could not be saved. Your current local data was kept.',
        diagnostics: ['Storage write failed before applying imported data.'],
        error: write.error,
      };

    try {
      this.autosave.replaceWithRestoredSnapshot(restored);
    } catch (cause) {
      await this.storage.save(
        APPLICATION_STATE_STORAGE_KEY,
        createSaveEnvelope(previous, {
          appVersion: environment.appVersion,
          metadata: {
            namespace: APPLICATION_STATE_STORAGE_KEY,
            contentType: 'application-state',
            revision: previous.revision,
          },
        }),
      );
      try {
        this.autosave.replaceWithRestoredSnapshot(previous);
      } catch {
        // Keep diagnostics privacy-safe; the storage rollback above preserves the previous save.
      }
      return {
        ok: false,
        stage: 'hydrate',
        message: 'Restore could not be loaded. Your previous local data was restored.',
        diagnostics: ['Application state hydration failed after write; rollback was attempted.'],
        error: { code: 'unknown', message: 'Unable to apply restored backup.', cause },
      };
    }

    return { ok: true, counts: preview.counts, warnings: preview.warnings };
  }

  private previewDocument(document: unknown): ApplicationBackupImportResult {
    if (!isRecord(document))
      return this.reject('validate', 'That file is not a supported backup.', [
        'Backup root must be an object.',
      ]);
    if (document['format'] !== APPLICATION_BACKUP_FORMAT)
      return this.reject('validate', 'That file was not exported by this app backup feature.', [
        'Unsupported backup format identifier.',
      ]);
    if (document['formatVersion'] !== APPLICATION_BACKUP_FORMAT_VERSION)
      return this.reject('validate', 'That backup version is not supported by this app version.', [
        'Unsupported or future backup format version.',
      ]);
    if (
      typeof document['exportedAt'] !== 'string' ||
      Number.isNaN(Date.parse(document['exportedAt']))
    )
      return this.reject('validate', 'That backup is missing required export metadata.', [
        'Missing or invalid export timestamp.',
      ]);
    if (
      !isRecord(document['application']) ||
      typeof document['application']['version'] !== 'string'
    )
      return this.reject('validate', 'That backup is missing required application metadata.', [
        'Missing application metadata.',
      ]);
    if (!isRecord(document['validation']) || document['validation']['ok'] !== true)
      return this.reject(
        'validate',
        'That backup does not include a completed validation record.',
        ['Missing validation metadata.'],
      );

    const save = migrateSaveEnvelope<unknown>(document['save']);
    if (!save.success)
      return this.reject('validate', 'That backup contains an unsupported save envelope.', [
        'Save envelope is malformed or future-versioned.',
      ]);
    if (!isRecord(save.value.payload))
      return this.reject('validate', 'That backup does not contain application state.', [
        'Save payload is not an object.',
      ]);

    const payload = save.value.payload;
    const character =
      payload['character'] == null
        ? null
        : migratePersistedActiveCharacter(
            createSaveEnvelope(payload['character'], {
              appVersion: save.value.appVersion,
              schemaVersion: save.value.schemaVersion,
              savedAt: save.value.savedAt,
            }),
          );
    if (payload['character'] != null && !character)
      return this.reject(
        'validate',
        'The character data in that backup is incomplete or incompatible.',
        ['Character validation failed.'],
      );
    const workspace =
      payload['workspace'] == null
        ? null
        : migratePersistedCampaignWorkspace(
            createSaveEnvelope(payload['workspace'], {
              appVersion: save.value.appVersion,
              schemaVersion: save.value.schemaVersion,
              savedAt: save.value.savedAt,
            }),
          );
    if (payload['workspace'] != null && !workspace)
      return this.reject(
        'validate',
        'The workspace data in that backup is incomplete or incompatible.',
        ['Workspace validation failed.'],
      );
    const history = migrateRollHistoryEntries(payload['rollHistory'] ?? []);
    if (!history.ok)
      return this.reject('validate', 'The roll history in that backup is incompatible.', [
        'Roll history validation failed.',
      ]);

    const snapshot: ApplicationStateSnapshot = {
      revision: Number.isInteger(payload['revision']) ? (payload['revision'] as number) : 0,
      character: character ? cloneJson(payload['character'] as Character) : null,
      workspace: workspace ? cloneJson(workspace) : null,
      rollHistory: cloneJson(history.entries),
    };
    const warnings = [
      ...(isRecord(document['validation']) && Array.isArray(document['validation']['warnings'])
        ? document['validation']['warnings'].filter((w): w is string => typeof w === 'string')
        : []),
      ...(history.discardedCount
        ? [`${history.discardedCount} invalid roll history record(s) were ignored during import.`]
        : []),
    ];
    return {
      ok: true,
      preview: {
        exportedAt: document['exportedAt'],
        sourceApplicationVersion: document['application']['version'],
        schemaVersion: save.value.schemaVersion,
        migratedSchemaVersion: save.value.schemaVersion,
        counts: countSnapshot(snapshot),
        warnings,
        replacementNotice:
          'Restoring this backup will replace all current local character, workspace, journal, oracle, vow, progress, and roll history data.',
        snapshot,
      },
    };
  }

  private reject(
    stage: ApplicationBackupImportStage,
    message: string,
    diagnostics: readonly string[],
  ): ApplicationBackupImportResult {
    return { ok: false, stage, message, diagnostics };
  }
}
