import { computed, Injectable, inject, signal } from '@angular/core';

import {
  cloneCustomOracleTable,
  toCustomOracleTable,
  type CustomOracleEntryInput,
  type CustomOracleTable,
  type SaveCustomOracleTableInput,
} from '@app/domain/oracles';
import {
  createDefaultProgressTrack,
  validateProgressTrackDetails,
  validateProgressTrackTicks,
  type ChallengeRank,
  type ProgressTrack,
  type ProgressTrackStatus,
  type ProgressTrackType,
} from '@app/domain/progress';
import {
  createDefaultVow,
  validateVowDetails,
  type Vow,
  type VowMilestone,
  type VowOutcome,
  type VowStatus,
} from '@app/domain/vows';
import {
  correctProgressTicks,
  progressScoreFromState,
  resolveProgressRoll,
  type ProgressRollInput,
  type ProgressRollResult,
  type ProgressValidationOptions,
} from '@app/rules/progress-rolls';
import { validateOracleTableCoverage, validateOracleTableShape } from '@app/rules/oracles';
import type { RulesResult, ValidationError } from '@app/rules/validation';
import { rulesFailure, rulesSuccess } from '@app/rules/validation';
import {
  CampaignWorkspacePersistenceService,
  toPersistedCampaignWorkspace,
  type CampaignWorkspaceLoadResult,
} from './campaign-workspace-persistence.service';

const cloneProgressTrack = (track: ProgressTrack): ProgressTrack => ({
  ...track,
  events: [...(track.events ?? [])],
});

const cloneVow = (vow: Vow): Vow => ({
  ...vow,
  milestones: [...(vow.milestones ?? [])].map((milestone) => ({ ...milestone })),
  outcome: vow.outcome ? { ...vow.outcome } : undefined,
});

const createEntityId = (prefix: string): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export interface SaveVowInput {
  readonly id?: string;
  readonly title: string;
  readonly description?: string;
  readonly rank: ChallengeRank;
  readonly status: VowStatus;
  readonly notes?: string;
}

export interface SaveProgressTrackInput {
  readonly id?: string;
  readonly title: string;
  readonly type: ProgressTrackType;
  readonly rank: ChallengeRank;
  readonly notes?: string;
}

export interface AddVowMilestoneInput {
  readonly vowId: string;
  readonly note?: string;
}

export interface UpdateVowMilestoneInput {
  readonly vowId: string;
  readonly milestoneId: string;
  readonly note?: string;
}

export interface RemoveVowMilestoneInput {
  readonly vowId: string;
  readonly milestoneId: string;
}

export interface UpdateVowRankInput {
  readonly vowId: string;
  readonly rank: unknown;
}

export interface UpdateVowStatusInput {
  readonly vowId: string;
  readonly status: unknown;
}

export interface UpdateVowOutcomeInput {
  readonly vowId: string;
  readonly summary: string;
}

export interface LinkVowProgressTrackInput {
  readonly vowId: string;
  readonly progressTrackId: string;
}

export interface CreateLinkedVowProgressTrackInput {
  readonly vowId: string;
}

export interface VowProgressRollResult extends ProgressRollResult {
  readonly vowId: string;
  readonly vowTitle: string;
  readonly progressTrackId: string;
  readonly trackTitle?: string;
  readonly trackType?: ProgressTrackType;
}

export interface ResolveVowProgressRollInput {
  readonly vowId: string;
  readonly challengeDice?: ProgressRollInput['challengeDice'];
  readonly rolledAt?: string;
}

export interface DeleteProgressTrackWarning {
  readonly code: 'linked_vow' | 'has_progress' | 'has_notes';
  readonly message: string;
}

export interface DeleteVowWarning {
  readonly code: 'linked_track' | 'has_milestones' | 'has_notes' | 'has_outcome';
  readonly message: string;
}

export interface ProgressTrackArchiveResult {
  readonly ok: true;
  readonly track: ProgressTrack;
}

export interface DeleteProgressTrackPreview {
  readonly ok: true;
  readonly track: ProgressTrack;
  readonly warnings: readonly DeleteProgressTrackWarning[];
}

export interface DeleteVowPreview {
  readonly ok: true;
  readonly vow: Vow;
  readonly warnings: readonly DeleteVowWarning[];
}

const compareVows = (left: Vow, right: Vow): number => {
  const leftCreated = typeof left.createdAt === 'string' ? left.createdAt : '';
  const rightCreated = typeof right.createdAt === 'string' ? right.createdAt : '';
  const createdComparison = leftCreated.localeCompare(rightCreated);

  return createdComparison !== 0 ? createdComparison : left.id.localeCompare(right.id);
};

const compareProgressTracks = (left: ProgressTrack, right: ProgressTrack): number => {
  const leftCreated = typeof left.createdAt === 'string' ? left.createdAt : '';
  const rightCreated = typeof right.createdAt === 'string' ? right.createdAt : '';
  const createdComparison = leftCreated.localeCompare(rightCreated);

  if (createdComparison !== 0) {
    return createdComparison;
  }

  return left.id.localeCompare(right.id);
};

@Injectable({ providedIn: 'root' })
export class CampaignWorkspaceService {
  private readonly persistence = inject(CampaignWorkspacePersistenceService);

  readonly saveStatus = this.persistence.saveStatus;
  readonly loadFailed = this.persistence.loadFailed;
  readonly lastSaveResult = this.persistence.lastSaveResult;
  readonly lastLoadError = this.persistence.lastLoadError;

  readonly workspaceName = signal('Local campaign workspace');
  readonly mode = signal('Ready for MVP features');

  private readonly customOracleTablesState = signal<readonly CustomOracleTable[]>([]);
  private readonly selectedCustomOracleTableIdState = signal<string | null>(null);
  readonly customOracleTables = computed<readonly CustomOracleTable[]>(() =>
    this.customOracleTablesState().map((table) => cloneCustomOracleTable(table)),
  );
  readonly selectedCustomOracleTableId = this.selectedCustomOracleTableIdState.asReadonly();

  private readonly vowsState = signal<readonly Vow[]>([]);
  private readonly selectedVowIdState = signal<string | null>(null);

  readonly vows = computed<readonly Vow[]>(() =>
    [...this.vowsState()].sort(compareVows).map((vow) => cloneVow(vow)),
  );
  readonly selectedVowId = this.selectedVowIdState.asReadonly();
  readonly selectedVow = computed<Vow | null>(() => {
    const selectedId = this.selectedVowIdState();
    const selected = this.vowsState().find((vow) => vow.id === selectedId);

    return selected ? cloneVow(selected) : null;
  });

  private readonly progressTracksState = signal<readonly ProgressTrack[]>([]);
  private readonly selectedProgressTrackIdState = signal<string | null>(null);

  readonly progressTracks = computed<readonly ProgressTrack[]>(() =>
    [...this.progressTracksState()]
      .sort(compareProgressTracks)
      .map((track) => cloneProgressTrack(track)),
  );
  readonly selectedProgressTrackId = this.selectedProgressTrackIdState.asReadonly();
  readonly selectedProgressTrack = computed<ProgressTrack | null>(() => {
    const selectedId = this.selectedProgressTrackIdState();
    const selected = this.progressTracksState().find((track) => track.id === selectedId);

    return selected ? cloneProgressTrack(selected) : null;
  });

  async loadSavedWorkspace(): Promise<CampaignWorkspaceLoadResult> {
    const result = await this.persistence.loadWorkspace();
    if (result.success && result.found) {
      this.progressTracksState.set(
        result.workspace.progressTracks.map((track) => cloneProgressTrack(track)),
      );
      this.selectedProgressTrackIdState.set(result.workspace.selectedProgressTrackId ?? null);
      this.vowsState.set(result.workspace.vows.map((vow) => cloneVow(vow)));
      this.selectedVowIdState.set(result.workspace.selectedVowId ?? null);
      this.customOracleTablesState.set(
        (result.workspace.customOracleTables ?? []).map((table) => cloneCustomOracleTable(table)),
      );
      this.selectedCustomOracleTableIdState.set(
        result.workspace.selectedCustomOracleTableId ?? null,
      );
    }
    return result;
  }

  private persistWorkspace(): void {
    void this.persistence.saveWorkspace(
      toPersistedCampaignWorkspace({
        progressTracks: this.progressTracksState(),
        selectedProgressTrackId: this.selectedProgressTrackIdState(),
        vows: this.vowsState(),
        selectedVowId: this.selectedVowIdState(),
        customOracleTables: this.customOracleTablesState(),
        selectedCustomOracleTableId: this.selectedCustomOracleTableIdState(),
      }),
    );
  }

  saveCustomOracleTable(
    input: SaveCustomOracleTableInput,
  ): { ok: true; table: CustomOracleTable } | { ok: false; errors: readonly ValidationError[] } {
    const id = input.id ?? createEntityId('custom-oracle');
    const existing = input.id
      ? this.customOracleTablesState().find((table) => table.id === input.id)
      : undefined;
    const now = new Date().toISOString();
    const entries = input.entries.map((entry: CustomOracleEntryInput, index) => ({
      id: entry.id && String(entry.id).trim() ? String(entry.id) : `${id}:entry-${index + 1}`,
      range: { min: Number(entry.min), max: Number(entry.max) },
      text: typeof entry.text === 'string' ? entry.text.trim() : '',
    }));
    const table = toCustomOracleTable({
      id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      name: typeof input.name === 'string' ? input.name.trim() : '',
      category: typeof input.category === 'string' ? input.category.trim() : '',
      description: typeof input.description === 'string' ? input.description.trim() : undefined,
      rollRange: { min: Number(input.rollMin), max: Number(input.rollMax) },
      entries,
    });
    const errors = [...validateOracleTableShape(table), ...validateOracleTableCoverage(table)];
    if (errors.length > 0) return { ok: false, errors };

    this.customOracleTablesState.update((tables) =>
      existing
        ? tables.map((candidate) => (candidate.id === existing.id ? table : candidate))
        : [...tables, table],
    );
    this.selectedCustomOracleTableIdState.set(table.id);
    this.persistWorkspace();
    return { ok: true, table: cloneCustomOracleTable(table) };
  }

  deleteCustomOracleTable(
    tableId: string,
  ): { ok: true; table: CustomOracleTable } | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.customOracleTablesState().find((table) => table.id === tableId);
    if (!existing) {
      return {
        ok: false,
        errors: [
          { code: 'not_found', field: 'tableId', message: 'Custom oracle table was not found.' },
        ],
      };
    }
    this.customOracleTablesState.update((tables) => tables.filter((table) => table.id !== tableId));
    if (this.selectedCustomOracleTableIdState() === tableId)
      this.selectedCustomOracleTableIdState.set(null);
    this.persistWorkspace();
    return { ok: true, table: cloneCustomOracleTable(existing) };
  }

  setVows(vows: readonly Vow[]): void {
    this.vowsState.set(vows.map((vow) => cloneVow(vow)));
    const selectedId = this.selectedVowIdState();

    if (selectedId && !vows.some((vow) => vow.id === selectedId)) {
      this.selectedVowIdState.set(null);
    }
    this.persistWorkspace();
  }

  saveVow(
    input: SaveVowInput,
  ): { ok: true; vow: Vow } | { ok: false; errors: readonly ValidationError[] } {
    const details = validateVowDetails(input);
    if (!details.ok) return { ok: false, errors: details.errors };

    const now = new Date().toISOString();
    const value = details.value;
    const existing = input.id ? this.vowsState().find((vow) => vow.id === input.id) : undefined;
    const vow = existing
      ? cloneVow({
          ...existing,
          title: value.title,
          description: value.description,
          rank: value.rank,
          status: value.status,
          notes: value.notes,
          updatedAt: now,
        })
      : createDefaultVow({
          id: createEntityId('vow'),
          createdAt: now,
          title: value.title,
          description: value.description,
          rank: value.rank,
          status: value.status,
          notes: value.notes,
        });

    this.vowsState.update((vows) =>
      existing
        ? vows.map((candidate) => (candidate.id === existing.id ? vow : candidate))
        : [...vows, vow],
    );
    this.selectedVowIdState.set(vow.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow) };
  }

  selectVow(vowId: string): Vow | null {
    const selected = this.vowsState().find((vow) => vow.id === vowId) ?? null;
    this.selectedVowIdState.set(selected?.id ?? null);

    return selected ? cloneVow(selected) : null;
  }

  updateVowRank(
    input: UpdateVowRankInput,
  ): { ok: true; vow: Vow } | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === input.vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }

    const details = validateVowDetails({ ...existing, rank: input.rank });
    if (!details.ok) return { ok: false, errors: details.errors };

    const vow = cloneVow({
      ...existing,
      rank: details.value.rank,
      updatedAt: new Date().toISOString(),
    });

    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === existing.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow) };
  }

  updateVowStatus(
    input: UpdateVowStatusInput,
  ): { ok: true; vow: Vow } | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === input.vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }

    const details = validateVowDetails({ ...existing, status: input.status });
    if (!details.ok) return { ok: false, errors: details.errors };

    const vow = cloneVow({
      ...existing,
      status: details.value.status,
      updatedAt: new Date().toISOString(),
    });

    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === existing.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow) };
  }

  archiveVow(
    vowId: string,
  ): { ok: true; vow: Vow } | { ok: false; errors: readonly ValidationError[] } {
    return this.updateVowStatus({ vowId, status: 'archived' });
  }

  restoreVow(
    vowId: string,
  ): { ok: true; vow: Vow } | { ok: false; errors: readonly ValidationError[] } {
    return this.updateVowStatus({ vowId, status: 'active' });
  }

  previewDeleteVow(
    vowId: string,
  ): DeleteVowPreview | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }

    const warnings: DeleteVowWarning[] = [];
    if (existing.progressTrackId) {
      warnings.push({
        code: 'linked_track',
        message: 'This vow has a linked progress track. The track will remain.',
      });
    }
    if ((existing.milestones ?? []).length > 0) {
      warnings.push({
        code: 'has_milestones',
        message: 'This vow has milestone notes. Deleting removes those vow notes.',
      });
    }
    if (typeof existing.notes === 'string' && existing.notes.trim()) {
      warnings.push({
        code: 'has_notes',
        message: 'This vow has notes. Deleting removes those vow notes.',
      });
    }
    if (existing.outcome?.summary || existing.outcome?.resolvedAt || existing.outcome?.rollId) {
      warnings.push({
        code: 'has_outcome',
        message: 'This vow has outcome data. Deleting removes the vow outcome.',
      });
    }

    return { ok: true, vow: cloneVow(existing), warnings };
  }

  deleteVow(
    vowId: string,
  ): { ok: true; vow: Vow } | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }

    this.vowsState.update((vows) => vows.filter((vow) => vow.id !== vowId));
    if (this.selectedVowIdState() === vowId) {
      this.selectedVowIdState.set(null);
    }
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(existing) };
  }

  updateVowOutcome(
    input: UpdateVowOutcomeInput,
  ):
    | { ok: true; vow: Vow; outcome: VowOutcome }
    | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === input.vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }

    if (typeof input.summary !== 'string') {
      return {
        ok: false,
        errors: [
          { code: 'invalid_type', field: 'outcome.summary', message: 'Enter outcome notes.' },
        ],
      };
    }

    const now = new Date().toISOString();
    const outcome: VowOutcome = {
      ...(existing.outcome ?? {}),
      summary: input.summary,
      resolvedAt: now,
    };
    const vow = cloneVow({
      ...existing,
      outcome,
      updatedAt: now,
    });

    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === existing.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow), outcome: { ...outcome } };
  }

  addVowMilestone(
    input: AddVowMilestoneInput,
  ):
    | { ok: true; vow: Vow; milestone: VowMilestone }
    | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === input.vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }

    const now = new Date().toISOString();
    const milestone: VowMilestone = {
      id: createEntityId('vow-milestone'),
      createdAt: now,
      updatedAt: now,
      note: input.note ?? '',
    };
    const vow = cloneVow({
      ...existing,
      milestones: [...(existing.milestones ?? []), milestone],
      updatedAt: now,
    });

    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === existing.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow), milestone: { ...milestone } };
  }

  updateVowMilestone(
    input: UpdateVowMilestoneInput,
  ):
    | { ok: true; vow: Vow; milestone: VowMilestone }
    | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === input.vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }
    const milestone = (existing.milestones ?? []).find((item) => item.id === input.milestoneId);
    if (!milestone) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'milestoneId', message: 'Milestone was not found.' }],
      };
    }

    const now = new Date().toISOString();
    const updated: VowMilestone = { ...milestone, note: input.note ?? '', updatedAt: now };
    const vow = cloneVow({
      ...existing,
      milestones: (existing.milestones ?? []).map((item) =>
        item.id === input.milestoneId ? updated : item,
      ),
      updatedAt: now,
    });

    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === existing.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow), milestone: { ...updated } };
  }

  removeVowMilestone(
    input: RemoveVowMilestoneInput,
  ): { ok: true; vow: Vow } | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === input.vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }
    if (!(existing.milestones ?? []).some((item) => item.id === input.milestoneId)) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'milestoneId', message: 'Milestone was not found.' }],
      };
    }

    const vow = cloneVow({
      ...existing,
      milestones: (existing.milestones ?? []).filter((item) => item.id !== input.milestoneId),
      updatedAt: new Date().toISOString(),
    });

    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === existing.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow) };
  }

  linkVowToProgressTrack(
    input: LinkVowProgressTrackInput,
  ):
    | { ok: true; vow: Vow; track: ProgressTrack }
    | { ok: false; errors: readonly ValidationError[] } {
    const existingVow = this.vowsState().find((vow) => vow.id === input.vowId);
    if (!existingVow) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }
    if (existingVow.progressTrackId && existingVow.progressTrackId !== input.progressTrackId) {
      return {
        ok: false,
        errors: [
          {
            code: 'conflict',
            field: 'progressTrackId',
            message: 'This vow already has a linked track. Unlink it first.',
          },
        ],
      };
    }

    const existingTrack = this.progressTracksState().find(
      (track) => track.id === input.progressTrackId,
    );
    if (!existingTrack) {
      return {
        ok: false,
        errors: [
          { code: 'not_found', field: 'progressTrackId', message: 'Progress track was not found.' },
        ],
      };
    }

    const linkedElsewhere = this.vowsState().find(
      (vow) => vow.id !== existingVow.id && vow.progressTrackId === existingTrack.id,
    );
    if (linkedElsewhere) {
      return {
        ok: false,
        errors: [
          {
            code: 'conflict',
            field: 'progressTrackId',
            message: 'That track is already linked to another vow.',
          },
        ],
      };
    }

    const now = new Date().toISOString();
    const vow = cloneVow({ ...existingVow, progressTrackId: existingTrack.id, updatedAt: now });
    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === vow.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.selectedProgressTrackIdState.set(existingTrack.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow), track: cloneProgressTrack(existingTrack) };
  }

  createProgressTrackForVow(
    input: CreateLinkedVowProgressTrackInput,
  ):
    | { ok: true; vow: Vow; track: ProgressTrack }
    | { ok: false; errors: readonly ValidationError[] } {
    const existingVow = this.vowsState().find((vow) => vow.id === input.vowId);
    if (!existingVow) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }
    if (existingVow.progressTrackId) {
      return {
        ok: false,
        errors: [
          {
            code: 'conflict',
            field: 'progressTrackId',
            message: 'This vow already has a linked track. Unlink it first.',
          },
        ],
      };
    }

    const now = new Date().toISOString();
    const track = createDefaultProgressTrack({
      id: createEntityId('progress-track'),
      createdAt: now,
      title: existingVow.title,
      type: 'vow',
      rank: existingVow.rank,
      notes: existingVow.notes,
    });
    const vow = cloneVow({ ...existingVow, progressTrackId: track.id, updatedAt: now });

    this.progressTracksState.update((tracks) => [...tracks, track]);
    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === vow.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.selectedProgressTrackIdState.set(track.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow), track: cloneProgressTrack(track) };
  }

  unlinkVowProgressTrack(
    vowId: string,
  ): { ok: true; vow: Vow } | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.vowsState().find((vow) => vow.id === vowId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }],
      };
    }

    const vow = cloneVow({
      ...existing,
      progressTrackId: undefined,
      updatedAt: new Date().toISOString(),
    });
    this.vowsState.update((vows) =>
      vows.map((candidate) => (candidate.id === vow.id ? vow : candidate)),
    );
    this.selectedVowIdState.set(vow.id);
    this.persistWorkspace();

    return { ok: true, vow: cloneVow(vow) };
  }

  clearVows(): void {
    this.vowsState.set([]);
    this.selectedVowIdState.set(null);
  }

  setProgressTracks(tracks: readonly ProgressTrack[]): void {
    this.progressTracksState.set(tracks.map((track) => cloneProgressTrack(track)));
    const selectedId = this.selectedProgressTrackIdState();

    if (selectedId && !tracks.some((track) => track.id === selectedId)) {
      this.selectedProgressTrackIdState.set(null);
    }
    this.persistWorkspace();
  }

  saveProgressTrack(
    input: SaveProgressTrackInput,
  ): { ok: true; track: ProgressTrack } | { ok: false; errors: readonly ValidationError[] } {
    const details = validateProgressTrackDetails(input);
    if (!details.ok) return { ok: false, errors: details.errors };

    const now = new Date().toISOString();
    const detailsValue = details.value;
    const existing = input.id
      ? this.progressTracksState().find((track) => track.id === input.id)
      : undefined;

    const track = existing
      ? cloneProgressTrack({
          ...existing,
          title: detailsValue.title,
          type: detailsValue.type,
          rank: detailsValue.rank,
          notes: detailsValue.notes,
          updatedAt: now,
        })
      : createDefaultProgressTrack({
          id: createEntityId('progress-track'),
          createdAt: now,
          title: detailsValue.title,
          type: detailsValue.type,
          rank: detailsValue.rank,
          notes: detailsValue.notes,
        });

    this.progressTracksState.update((tracks) =>
      existing
        ? tracks.map((candidate) => (candidate.id === existing.id ? track : candidate))
        : [...tracks, track],
    );
    this.selectedProgressTrackIdState.set(track.id);
    this.persistWorkspace();

    return { ok: true, track: cloneProgressTrack(track) };
  }

  selectProgressTrack(trackId: string): ProgressTrack | null {
    const selected = this.progressTracksState().find((track) => track.id === trackId) ?? null;
    this.selectedProgressTrackIdState.set(selected?.id ?? null);
    this.persistWorkspace();

    return selected ? cloneProgressTrack(selected) : null;
  }

  updateProgressTrackTicks(
    trackId: string,
    ticks: number,
    options?: ProgressValidationOptions,
  ): { ok: true; track: ProgressTrack } | { ok: false; errors: readonly ValidationError[] } {
    const progress = validateProgressTrackTicks({
      ticks,
      mode: options?.mode === 'manual_correction' ? 'manual_override' : 'standard',
    });
    if (!progress.ok) return { ok: false, errors: progress.errors };

    const existing = this.progressTracksState().find((track) => track.id === trackId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'trackId', message: 'Progress track was not found.' }],
      };
    }

    const track = cloneProgressTrack({
      ...existing,
      ticks: progress.value.ticks,
      progressMode: progress.value.mode,
      updatedAt: new Date().toISOString(),
    });

    this.progressTracksState.update((tracks) =>
      tracks.map((candidate) => (candidate.id === trackId ? track : candidate)),
    );
    this.selectedProgressTrackIdState.set(track.id);
    this.persistWorkspace();

    return { ok: true, track: cloneProgressTrack(track) };
  }

  archiveProgressTrack(
    trackId: string,
  ): ProgressTrackArchiveResult | { ok: false; errors: readonly ValidationError[] } {
    return this.updateProgressTrackStatus(trackId, 'archived');
  }

  restoreProgressTrack(
    trackId: string,
  ): ProgressTrackArchiveResult | { ok: false; errors: readonly ValidationError[] } {
    return this.updateProgressTrackStatus(trackId, 'active');
  }

  previewDeleteProgressTrack(
    trackId: string,
  ): DeleteProgressTrackPreview | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.progressTracksState().find((track) => track.id === trackId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'trackId', message: 'Progress track was not found.' }],
      };
    }

    const linkedVow = this.vowsState().find((vow) => vow.progressTrackId === trackId);
    const warnings: DeleteProgressTrackWarning[] = [];
    if (linkedVow) {
      warnings.push({
        code: 'linked_vow',
        message: `Linked vow "${linkedVow.title.trim() || 'Untitled vow'}" will remain and may need repair later.`,
      });
    }
    if (existing.ticks > 0 || (existing.events ?? []).length > 0) {
      warnings.push({
        code: 'has_progress',
        message: 'This track contains marked progress. Deleting removes the track record only.',
      });
    }
    if (typeof existing.notes === 'string' && existing.notes.trim()) {
      warnings.push({
        code: 'has_notes',
        message:
          'This track contains user-authored notes. Deleting removes those notes with the track.',
      });
    }

    return { ok: true, track: cloneProgressTrack(existing), warnings };
  }

  deleteProgressTrack(
    trackId: string,
  ): { ok: true; track: ProgressTrack } | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.progressTracksState().find((track) => track.id === trackId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'trackId', message: 'Progress track was not found.' }],
      };
    }

    this.progressTracksState.update((tracks) => tracks.filter((track) => track.id !== trackId));
    if (this.selectedProgressTrackIdState() === trackId) {
      this.selectedProgressTrackIdState.set(null);
    }
    this.persistWorkspace();

    return { ok: true, track: cloneProgressTrack(existing) };
  }

  private updateProgressTrackStatus(
    trackId: string,
    status: ProgressTrackStatus,
  ): ProgressTrackArchiveResult | { ok: false; errors: readonly ValidationError[] } {
    const existing = this.progressTracksState().find((track) => track.id === trackId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'trackId', message: 'Progress track was not found.' }],
      };
    }

    const track = cloneProgressTrack({
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    });
    this.progressTracksState.update((tracks) =>
      tracks.map((candidate) => (candidate.id === trackId ? track : candidate)),
    );
    this.selectedProgressTrackIdState.set(track.id);
    this.persistWorkspace();

    return { ok: true, track: cloneProgressTrack(track) };
  }

  resolveProgressRollForTrack(trackId: string): RulesResult<Readonly<ProgressRollResult>> {
    const existing = this.progressTracksState().find((track) => track.id === trackId);
    if (!existing) {
      return rulesFailure([
        { code: 'not_found', field: 'trackId', message: 'Progress track was not found.' },
      ]);
    }

    const progress = progressScoreFromState({ ticks: existing.ticks });
    if (!progress.ok) return rulesFailure(progress.errors);

    return resolveProgressRoll({
      trackId: existing.id,
      progressScore: progress.value.progressScore,
    });
  }

  resolveProgressRollForVow(
    input: ResolveVowProgressRollInput,
  ): RulesResult<Readonly<VowProgressRollResult>> {
    const vow = this.vowsState().find((candidate) => candidate.id === input.vowId);
    if (!vow) {
      return rulesFailure([{ code: 'not_found', field: 'vowId', message: 'Vow was not found.' }]);
    }
    if (!vow.progressTrackId) {
      return rulesFailure([
        {
          code: 'missing_link',
          field: 'progressTrackId',
          message: 'Link a progress track to roll.',
        },
      ]);
    }

    const track = this.progressTracksState().find(
      (candidate) => candidate.id === vow.progressTrackId,
    );
    if (!track) {
      return rulesFailure([
        {
          code: 'broken_link',
          field: 'progressTrackId',
          message: 'Linked progress track is missing.',
        },
      ]);
    }

    const progress = progressScoreFromState({ ticks: track.ticks });
    if (!progress.ok) return rulesFailure(progress.errors);

    const roll = resolveProgressRoll({
      trackId: track.id,
      progressScore: progress.value.progressScore,
      challengeDice: input.challengeDice,
      rolledAt: input.rolledAt,
    });
    if (!roll.ok) return roll;

    return rulesSuccess(
      Object.freeze({
        ...roll.value,
        vowId: vow.id,
        vowTitle: vow.title,
        progressTrackId: track.id,
        trackTitle: track.title,
        trackType: track.type,
      }),
    );
  }

  clearProgressTracks(): void {
    this.progressTracksState.set([]);
    this.selectedProgressTrackIdState.set(null);
    this.persistWorkspace();
  }
}
