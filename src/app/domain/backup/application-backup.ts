import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { createSaveEnvelope, safeStringify, type StorageError } from '@app/core/storage';
import { AppInfoService } from '@app/core/services/app-info.service';
import { migratePersistedActiveCharacter } from '@app/domain/character/active-character-persistence.migrations';
import { migrateRollHistoryEntries } from '@app/domain/rolls/roll-history.migrations';
import {
  ApplicationAutosaveService,
  type ApplicationStateSnapshot,
} from '@app/domain/services/application-autosave.service';
import { migratePersistedCampaignWorkspace } from '@app/domain/services/campaign-workspace-persistence.migrations';
import { environment } from '@environments/environment';

export const APPLICATION_BACKUP_FORMAT = 'ironsworn-local-mvp-backup';
export const APPLICATION_BACKUP_FORMAT_VERSION = 1;

export interface ApplicationBackupEnvelope {
  readonly format: typeof APPLICATION_BACKUP_FORMAT;
  readonly formatVersion: number;
  readonly exportedAt: string;
  readonly application: {
    readonly name: string;
    readonly version: string;
    readonly environment: string;
  };
  readonly save: ReturnType<typeof createSaveEnvelope<ApplicationStateSnapshot>>;
  readonly validation: {
    readonly ok: true;
    readonly validatedAt: string;
    readonly domains: {
      readonly character: boolean;
      readonly workspace: boolean;
      readonly rollHistory: boolean;
    };
    readonly counts: ApplicationBackupRecordCounts;
    readonly warnings: readonly string[];
  };
}

export interface ApplicationBackupRecordCounts {
  readonly characters: number;
  readonly progressTracks: number;
  readonly vows: number;
  readonly rollHistoryEntries: number;
  readonly journalEntries: number;
  readonly customOracleTables: number;
}

export type ApplicationBackupResult =
  | {
      readonly ok: true;
      readonly envelope: ApplicationBackupEnvelope;
      readonly json: string;
      readonly filename: string;
      readonly counts: ApplicationBackupRecordCounts;
      readonly warnings: readonly string[];
    }
  | { readonly ok: false; readonly error: StorageError; readonly diagnostics: readonly string[] };

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const safeFilenamePart = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'ironsworn';

export const createBackupFilename = (input: {
  readonly appName: string;
  readonly appVersion: string;
  readonly exportedAt: string;
}): string => {
  const date = input.exportedAt.slice(0, 10);
  return `${safeFilenamePart(input.appName)}-backup-${date}-v${safeFilenamePart(input.appVersion)}.json`;
};

@Injectable({ providedIn: 'root' })
export class ApplicationBackupService {
  private readonly autosave = inject(ApplicationAutosaveService);
  private readonly appInfo = inject(AppInfoService);
  private readonly document = inject(DOCUMENT);

  createBackup(exportedAt = new Date().toISOString()): ApplicationBackupResult {
    let snapshot: ApplicationStateSnapshot;
    try {
      snapshot = cloneJson(this.autosave.createSnapshot());
    } catch (cause) {
      return {
        ok: false,
        error: {
          code: 'serialization-failed',
          message: 'Unable to serialize the current application state for backup.',
          cause,
        },
        diagnostics: ['Current state could not be copied into a JSON-safe backup snapshot.'],
      };
    }

    const validation = this.validateSnapshot(snapshot, exportedAt);
    if (!validation.ok) return validation;

    const envelope: ApplicationBackupEnvelope = {
      format: APPLICATION_BACKUP_FORMAT,
      formatVersion: APPLICATION_BACKUP_FORMAT_VERSION,
      exportedAt,
      application: {
        name: this.appInfo.appName(),
        version: this.appInfo.version(),
        environment: String(this.appInfo.environmentName()),
      },
      save: createSaveEnvelope(snapshot, {
        appVersion: environment.appVersion,
        savedAt: exportedAt,
        metadata: {
          namespace: 'ironsworn.applicationBackup',
          contentType: 'application-state-backup',
          revision: snapshot.revision,
          sourceFormat: APPLICATION_BACKUP_FORMAT,
        },
      }),
      validation: {
        ok: true,
        validatedAt: exportedAt,
        domains: { character: true, workspace: true, rollHistory: true },
        counts: validation.counts,
        warnings: validation.warnings,
      },
    };

    const serialized = safeStringify(envelope);
    if (!serialized.success) {
      return {
        ok: false,
        error: serialized.error,
        diagnostics: ['Backup JSON generation failed before any file was downloaded.'],
      };
    }

    return {
      ok: true,
      envelope,
      json: `${JSON.stringify(envelope, null, 2)}\n`,
      filename: createBackupFilename({
        appName: this.appInfo.appName(),
        appVersion: this.appInfo.version(),
        exportedAt,
      }),
      counts: validation.counts,
      warnings: validation.warnings,
    };
  }

  downloadBackup(result: Extract<ApplicationBackupResult, { ok: true }>): void {
    const blob = new Blob([result.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = result.filename;
    link.rel = 'noopener';
    link.click();
    URL.revokeObjectURL(url);
  }

  exportAndDownload(): ApplicationBackupResult {
    const result = this.createBackup();
    if (result.ok) this.downloadBackup(result);
    return result;
  }

  private validateSnapshot(
    snapshot: ApplicationStateSnapshot,
    validatedAt: string,
  ):
    | {
        readonly ok: true;
        readonly counts: ApplicationBackupRecordCounts;
        readonly warnings: readonly string[];
      }
    | Extract<ApplicationBackupResult, { ok: false }> {
    const diagnostics: string[] = [];
    if (snapshot.character) {
      const character = migratePersistedActiveCharacter(
        createSaveEnvelope(snapshot.character, {
          appVersion: environment.appVersion,
          savedAt: validatedAt,
        }),
      );
      if (!character) diagnostics.push('Character data is incomplete or outside supported ranges.');
    }
    if (snapshot.workspace) {
      const workspace = migratePersistedCampaignWorkspace(
        createSaveEnvelope(snapshot.workspace, {
          appVersion: environment.appVersion,
          savedAt: validatedAt,
        }),
      );
      if (!workspace) diagnostics.push('Workspace data is incomplete or outside supported ranges.');
    }
    const history = migrateRollHistoryEntries(snapshot.rollHistory ?? []);
    if (!history.ok) diagnostics.push('Roll history is not in a supported persisted shape.');
    if (diagnostics.length > 0) {
      return {
        ok: false,
        error: {
          code: 'malformed-data',
          message: 'Backup was not created because the current application state is invalid.',
        },
        diagnostics,
      };
    }
    const workspace = snapshot.workspace;
    const counts: ApplicationBackupRecordCounts = {
      characters: snapshot.character ? 1 : 0,
      progressTracks: workspace?.progressTracks.length ?? 0,
      vows: workspace?.vows.length ?? 0,
      rollHistoryEntries: snapshot.rollHistory?.length ?? 0,
      journalEntries: workspace?.journalEntries?.length ?? 0,
      customOracleTables: workspace?.customOracleTables?.length ?? 0,
    };
    const warnings =
      history.ok && history.discardedCount > 0
        ? [`${history.discardedCount} invalid roll history record(s) were not recoverable.`]
        : [];
    return { ok: true, counts, warnings };
  }
}
