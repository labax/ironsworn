import { Injectable, inject, signal } from '@angular/core';
import {
  LocalStorageAdapter,
  createSaveEnvelope,
  type LoadResult,
  type SaveResult,
  type StorageError,
} from '@app/core/storage';
import { environment } from '@environments/environment';

import type { JournalEntry } from '../journal';
import type { CustomOracleTable } from '../oracles';
import type { ProgressTrack } from '../progress';
import type { Vow } from '../vows';
import {
  migratePersistedCampaignWorkspace,
  type PersistedCampaignWorkspace,
} from './campaign-workspace-persistence.migrations';

export const CAMPAIGN_WORKSPACE_STORAGE_KEY = 'ironsworn.campaignWorkspace';
export type CampaignWorkspaceSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export type CampaignWorkspaceLoadResult =
  | { readonly success: true; readonly found: true; readonly workspace: PersistedCampaignWorkspace }
  | { readonly success: true; readonly found: false }
  | { readonly success: false; readonly error: StorageError };

export const toPersistedCampaignWorkspace = (input: {
  readonly progressTracks: readonly ProgressTrack[];
  readonly selectedProgressTrackId?: string | null;
  readonly vows?: readonly Vow[];
  readonly selectedVowId?: string | null;
  readonly customOracleTables?: readonly CustomOracleTable[];
  readonly selectedCustomOracleTableId?: string | null;
  readonly journalEntries?: readonly JournalEntry[];
  readonly selectedJournalEntryId?: string | null;
}): PersistedCampaignWorkspace => ({
  progressTracks: input.progressTracks.map((track) => ({
    ...track,
    events: [...(track.events ?? [])],
  })),
  selectedProgressTrackId: input.selectedProgressTrackId ?? undefined,
  vows: (input.vows ?? []).map((vow) => ({
    ...vow,
    milestones: [...(vow.milestones ?? [])].map((milestone) => ({ ...milestone })),
    outcome: vow.outcome ? { ...vow.outcome } : undefined,
  })),
  selectedVowId: input.selectedVowId ?? undefined,
  customOracleTables: (input.customOracleTables ?? []).map((table) => ({
    ...table,
    rollRange: { ...table.rollRange },
    provenance: { ...table.provenance },
    entries: table.entries.map((entry) => ({
      ...entry,
      range: { ...entry.range },
      provenance: entry.provenance ? { ...entry.provenance } : undefined,
    })),
    metadata: table.metadata ? { ...table.metadata } : undefined,
  })),
  selectedCustomOracleTableId: input.selectedCustomOracleTableId ?? undefined,
  journalEntries: (input.journalEntries ?? []).map((entry) => ({
    ...entry,
    links: { ...entry.links },
    sourceReferences: [...(entry.sourceReferences ?? [])].map((reference) => ({ ...reference })),
    snapshots: [...(entry.snapshots ?? [])].map((snapshot) => ({ ...snapshot })),
    tags: [...(entry.tags ?? [])],
  })),
  selectedJournalEntryId: input.selectedJournalEntryId ?? undefined,
});

@Injectable({ providedIn: 'root' })
export class CampaignWorkspacePersistenceService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly saveStatusState = signal<CampaignWorkspaceSaveStatus>('idle');
  private readonly loadFailedState = signal(false);
  private readonly lastSaveResultState = signal<SaveResult | null>(null);
  private readonly lastLoadErrorState = signal<StorageError | null>(null);

  readonly saveStatus = this.saveStatusState.asReadonly();
  readonly loadFailed = this.loadFailedState.asReadonly();
  readonly lastSaveResult = this.lastSaveResultState.asReadonly();
  readonly lastLoadError = this.lastLoadErrorState.asReadonly();

  async loadWorkspace(): Promise<CampaignWorkspaceLoadResult> {
    const result: LoadResult<unknown> = await this.storage.load(CAMPAIGN_WORKSPACE_STORAGE_KEY);
    if (!result.success) {
      this.loadFailedState.set(true);
      this.lastLoadErrorState.set(result.error);
      return result;
    }
    if (!result.found) return result;

    const workspace = migratePersistedCampaignWorkspace(result.data);
    if (!workspace) {
      const error: StorageError = {
        code: 'malformed-data',
        message: 'Saved campaign workspace data is incomplete or outside supported ranges.',
      };
      this.loadFailedState.set(true);
      this.lastLoadErrorState.set(error);
      return { success: false, error };
    }

    this.loadFailedState.set(false);
    this.lastLoadErrorState.set(null);
    return { success: true, found: true, workspace };
  }

  async saveWorkspace(workspace: PersistedCampaignWorkspace): Promise<SaveResult> {
    this.saveStatusState.set('saving');
    const result = await this.storage.save(
      CAMPAIGN_WORKSPACE_STORAGE_KEY,
      createSaveEnvelope(workspace, {
        appVersion: environment.appVersion,
        metadata: { namespace: CAMPAIGN_WORKSPACE_STORAGE_KEY, contentType: 'campaign-workspace' },
      }),
    );
    this.lastSaveResultState.set(result);
    this.saveStatusState.set(result.success ? 'saved' : 'failed');
    return result;
  }
}
