import { Injectable, inject, signal } from '@angular/core';
import {
  LocalStorageAdapter,
  createSaveEnvelope,
  type LoadResult,
  type SaveResult,
  type StorageError,
  type VersionedSaveEnvelope,
} from '@app/core/storage';
import type { Character } from '@app/domain/character/character';
import type { RollHistoryEntry } from '@app/domain/rolls/roll-history-entry';
import { environment } from '@environments/environment';

import {
  migratePersistedCampaignWorkspace,
  type PersistedCampaignWorkspace,
} from './campaign-workspace-persistence.migrations';

export const APPLICATION_STATE_STORAGE_KEY = 'ironsworn.applicationState';
export const AUTOSAVE_DEBOUNCE_MS = 250;

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'failed';
export type ApplicationStateDomain = 'character' | 'workspace' | 'rollHistory';

type ApplicationStateSources = {
  readonly character?: Character | null;
  readonly workspace?: PersistedCampaignWorkspace | null;
  readonly rollHistory?: readonly RollHistoryEntry[] | null;
};

export interface ApplicationStateSnapshot extends ApplicationStateSources {
  readonly revision: number;
}

type SnapshotSource<K extends ApplicationStateDomain> = {
  readonly snapshot: () => ApplicationStateSources[K];
  readonly restore: (value: ApplicationStateSources[K]) => void;
};

export type ApplicationStateLoadResult =
  | { readonly success: true; readonly found: true; readonly snapshot: ApplicationStateSnapshot }
  | { readonly success: true; readonly found: false }
  | { readonly success: false; readonly error: StorageError };

const cloneJson = <T>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const migrateApplicationStateSnapshot = (
  envelope: VersionedSaveEnvelope<unknown>,
): ApplicationStateSnapshot | null => {
  if (!isRecord(envelope.payload)) return null;
  const metadataRevision = envelope.metadata?.['revision'];
  const revision = Number.isInteger(metadataRevision)
    ? (metadataRevision as number)
    : Number.isInteger(envelope.payload['revision'])
      ? (envelope.payload['revision'] as number)
      : 0;
  const workspace =
    envelope.payload['workspace'] === undefined || envelope.payload['workspace'] === null
      ? null
      : migratePersistedCampaignWorkspace(
          createSaveEnvelope(envelope.payload['workspace'], {
            appVersion: envelope.appVersion,
            schemaVersion: envelope.schemaVersion,
            savedAt: envelope.savedAt,
          }),
        );
  if (envelope.payload['workspace'] && !workspace) return null;

  return {
    revision,
    character: cloneJson(envelope.payload['character'] as Character | null | undefined),
    workspace,
    rollHistory: Array.isArray(envelope.payload['rollHistory'])
      ? cloneJson(envelope.payload['rollHistory'] as readonly RollHistoryEntry[])
      : [],
  };
};

@Injectable({ providedIn: 'root' })
export class ApplicationAutosaveService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly sources = new Map<
    ApplicationStateDomain,
    SnapshotSource<ApplicationStateDomain>
  >();
  private readonly saveStatusState = signal<AutosaveStatus>('idle');
  private readonly lastSaveResultState = signal<SaveResult | null>(null);
  private readonly lastErrorState = signal<StorageError | null>(null);
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private currentRevision = 0;
  private lastSavedRevision = 0;
  private inFlightRevision = 0;
  private pendingAfterInFlight = false;
  private initialized = false;
  private resetInProgress = false;

  readonly saveStatus = this.saveStatusState.asReadonly();
  readonly lastSaveResult = this.lastSaveResultState.asReadonly();
  readonly lastError = this.lastErrorState.asReadonly();
  readonly revision = () => this.currentRevision;
  readonly savedRevision = () => this.lastSavedRevision;

  registerSource<K extends ApplicationStateDomain>(domain: K, source: SnapshotSource<K>): void {
    this.sources.set(domain, source as unknown as SnapshotSource<ApplicationStateDomain>);
  }

  markInitialized(): void {
    this.initialized = true;
  }

  replaceWithRestoredSnapshot(snapshot: ApplicationStateSnapshot): void {
    this.clearDebounce();
    this.pendingAfterInFlight = false;
    this.restore(snapshot);
    this.currentRevision = Math.max(snapshot.revision, this.lastSavedRevision) + 1;
    this.lastSavedRevision = this.currentRevision;
    this.inFlightRevision = 0;
    this.lastSaveResultState.set({ success: true });
    this.lastErrorState.set(null);
    this.saveStatusState.set('saved');
  }

  beginReset(): void {
    this.resetInProgress = true;
    this.clearDebounce();
    this.pendingAfterInFlight = false;
  }

  completeResetToEmptyState(): void {
    this.clearDebounce();
    this.pendingAfterInFlight = false;
    this.currentRevision = 0;
    this.lastSavedRevision = 0;
    this.inFlightRevision = 0;
    this.lastSaveResultState.set({ success: true });
    this.lastErrorState.set(null);
    this.saveStatusState.set('idle');
  }

  endReset(): void {
    this.resetInProgress = false;
  }

  markCommittedChange(_domain: ApplicationStateDomain): void {
    if (!this.initialized || this.resetInProgress) return;
    this.currentRevision += 1;
    this.pendingAfterInFlight = this.inFlightRevision > 0;
    this.schedule();
  }

  async loadSavedSnapshot(): Promise<ApplicationStateLoadResult> {
    const result: LoadResult<unknown> = await this.storage.load(APPLICATION_STATE_STORAGE_KEY);
    if (!result.success || !result.found) return result;
    const snapshot = migrateApplicationStateSnapshot(result.data);
    if (!snapshot) {
      return {
        success: false,
        error: {
          code: 'malformed-data',
          message: 'Saved application state snapshot is incomplete or unsupported.',
        },
      };
    }
    this.restore(snapshot);
    this.currentRevision = snapshot.revision;
    this.lastSavedRevision = snapshot.revision;
    this.saveStatusState.set('saved');
    return { success: true, found: true, snapshot };
  }

  retry(): Promise<SaveResult> {
    this.currentRevision = Math.max(this.currentRevision + 1, this.lastSavedRevision + 1);
    return this.flush();
  }

  async flush(): Promise<SaveResult> {
    this.clearDebounce();
    if (this.resetInProgress) return { success: true };
    if (this.inFlightRevision) {
      this.pendingAfterInFlight = true;
      return { success: true };
    }
    if (this.currentRevision <= this.lastSavedRevision && this.saveStatusState() !== 'failed') {
      return { success: true };
    }
    return this.writeCurrentSnapshot();
  }

  createSnapshot(): ApplicationStateSnapshot {
    return {
      revision: this.currentRevision,
      character: cloneJson(
        (this.sources.get('character')?.snapshot() as Character | null | undefined) ?? null,
      ),
      workspace: cloneJson(
        (this.sources.get('workspace')?.snapshot() as
          PersistedCampaignWorkspace | null | undefined) ?? null,
      ),
      rollHistory: cloneJson(
        (this.sources.get('rollHistory')?.snapshot() as
          readonly RollHistoryEntry[] | null | undefined) ?? [],
      ),
    };
  }

  private schedule(): void {
    this.clearDebounce();
    this.debounceHandle = setTimeout(() => void this.flush(), AUTOSAVE_DEBOUNCE_MS);
  }

  private clearDebounce(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = null;
  }

  private async writeCurrentSnapshot(): Promise<SaveResult> {
    if (this.resetInProgress) return { success: true };
    const snapshot = this.createSnapshot();
    const revision = snapshot.revision;
    this.inFlightRevision = revision;
    this.saveStatusState.set('saving');
    const result = await this.storage.save(
      APPLICATION_STATE_STORAGE_KEY,
      createSaveEnvelope(snapshot, {
        appVersion: environment.appVersion,
        metadata: {
          namespace: APPLICATION_STATE_STORAGE_KEY,
          contentType: 'application-state',
          revision,
        },
      }),
    );
    if (revision >= this.lastSavedRevision && this.inFlightRevision === revision) {
      this.lastSaveResultState.set(result);
      this.lastErrorState.set(result.success ? null : result.error);
      if (result.success) this.lastSavedRevision = revision;
      this.saveStatusState.set(result.success ? 'saved' : 'failed');
    }
    this.inFlightRevision = 0;
    if (
      !this.resetInProgress &&
      (this.pendingAfterInFlight || this.currentRevision > this.lastSavedRevision)
    ) {
      this.pendingAfterInFlight = false;
      void this.flush();
    }
    return result;
  }

  private restore(snapshot: ApplicationStateSnapshot): void {
    this.sources.get('character')?.restore(snapshot.character ?? null);
    this.sources.get('workspace')?.restore(snapshot.workspace ?? null);
    this.sources.get('rollHistory')?.restore(snapshot.rollHistory ?? []);
  }
}
