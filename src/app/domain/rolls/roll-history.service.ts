import { Injectable, inject, signal } from '@angular/core';
import { ApplicationAutosaveService } from '@app/domain/services/application-autosave.service';

import { createDomainEntity, type ISODateString } from '../shared';
import type { MomentumBurn, PreparedActionRollInput, RollHistoryEntry } from './index';
import type { SaveResult } from '@app/core/storage';
import type { ActionRollResult, ProgressRollResult } from '@app/rules';
import type { ResolvedOracleTableResult } from '@app/rules/oracles';
import {
  RollHistoryPersistenceService,
  type RollHistoryLoadResult,
} from './roll-history.persistence';

export interface SaveActionRollHistoryInput {
  readonly prepared: PreparedActionRollInput;
  readonly result: ActionRollResult;
  readonly createdAt?: ISODateString;
  readonly note?: string;
}

export interface SaveProgressRollHistoryInput {
  readonly result: Readonly<ProgressRollResult>;
  readonly trackTitle: string;
  readonly trackType: string;
  readonly vowId?: string;
  readonly vowTitle?: string;
  readonly note?: string;
  readonly clientSaveKey?: string;
}

export interface SaveOracleRollHistoryInput {
  readonly result: ResolvedOracleTableResult;
  readonly note?: string;
  readonly clientSaveKey?: string;
}

export interface FinalizeActionRollMomentumBurnInput {
  readonly id?: string;
  readonly prepared: PreparedActionRollInput;
  readonly result: ActionRollResult;
  readonly finalOutcome: ActionRollResult['outcome'];
  readonly momentumBurn: MomentumBurn;
}

const cloneEntry = (entry: RollHistoryEntry): RollHistoryEntry => ({
  ...entry,
  actionRoll: entry.actionRoll
    ? {
        ...entry.actionRoll,
        challengeDice: [...entry.actionRoll.challengeDice] as [number, number],
      }
    : undefined,
  progressRoll: entry.progressRoll
    ? {
        ...entry.progressRoll,
        challengeDice: [...entry.progressRoll.challengeDice] as [number, number],
      }
    : undefined,
  oracleRoll: entry.oracleRoll
    ? {
        ...entry.oracleRoll,
        entryRange: { ...entry.oracleRoll.entryRange },
        provenance: { ...entry.oracleRoll.provenance },
        tableProvenance: { ...entry.oracleRoll.tableProvenance },
      }
    : undefined,
  momentumBurn: entry.momentumBurn
    ? { ...entry.momentumBurn, canceledDice: [...entry.momentumBurn.canceledDice] }
    : undefined,
});

@Injectable({ providedIn: 'root' })
export class RollHistoryService {
  private readonly persistence = inject(RollHistoryPersistenceService);
  private readonly autosave = inject(ApplicationAutosaveService);
  private readonly entriesState = signal<readonly RollHistoryEntry[]>([]);
  private nextId = 1;
  private readonly oracleSaveKeys = new Set<string>();
  private readonly progressSaveKeys = new Set<string>();

  readonly saveStatus = this.persistence.saveStatus;
  readonly loadFailed = this.persistence.loadFailed;
  readonly lastSaveResult = this.persistence.lastSaveResult;
  readonly lastLoadError = this.persistence.lastLoadError;

  constructor() {
    this.autosave.registerSource('rollHistory', {
      snapshot: () => this.entriesState().map((entry) => cloneEntry(entry)),
      restore: (entries) => this.restoreEntries(entries ?? []),
    });
  }

  entries(): readonly RollHistoryEntry[] {
    return this.entriesState().map((entry) => cloneEntry(entry));
  }

  saveActionRoll(input: SaveActionRollHistoryInput): RollHistoryEntry {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const entry: RollHistoryEntry = {
      ...createDomainEntity({
        id: `roll-history-${this.nextId++}`,
        createdAt,
      }),
      type: 'action',
      source: 'generated',
      outcome: input.result.outcome,
      actionRoll: {
        actionDie: input.result.actionDie,
        challengeDice: [...input.result.challengeDice] as [number, number],
        statBonus: input.prepared.statValue,
        adds: input.prepared.adds,
        actionScore: input.result.cappedScore,
      },
      isMatch: input.result.isMatch,
      label: input.prepared.label,
      notes: input.note,
    };

    this.entriesState.update((entries) => [...entries, entry]);
    this.autosave.markCommittedChange('rollHistory');
    void this.persistence.saveHistory(this.entriesState().map((entry) => cloneEntry(entry)));
    return cloneEntry(entry);
  }

  saveProgressRoll(input: SaveProgressRollHistoryInput): RollHistoryEntry {
    const saveKey =
      input.clientSaveKey ??
      `${input.result.rolledAt}:${input.result.trackId}:${input.result.progressScore}:${input.result.challengeDice[0]}:${input.result.challengeDice[1]}`;
    const existing = this.entriesState().find(
      (entry) => entry.type === 'progress' && entry.label === saveKey,
    );
    if (existing) return cloneEntry(existing);

    this.progressSaveKeys.add(saveKey);
    const entry: RollHistoryEntry = {
      ...createDomainEntity({
        id: `roll-history-${this.nextId++}`,
        createdAt: input.result.rolledAt,
      }),
      type: 'progress',
      source: input.result.source,
      progressTrackId: input.result.trackId,
      outcome: input.result.outcome,
      label: saveKey,
      progressRoll: {
        progressScore: input.result.progressScore,
        challengeDice: [...input.result.challengeDice] as [number, number],
        trackId: input.result.trackId,
        trackType: input.trackType,
        trackTitle: input.trackTitle,
        vowId: input.vowId,
        vowTitle: input.vowTitle,
        resolvedAt: input.result.rolledAt,
      },
      isMatch: input.result.isMatch,
      notes: input.note?.trim() || undefined,
    };

    this.entriesState.update((entries) => [...entries, entry]);
    this.autosave.markCommittedChange('rollHistory');
    void this.persistence.saveHistory(this.entriesState().map((entry) => cloneEntry(entry)));
    return cloneEntry(entry);
  }

  saveOracleRoll(input: SaveOracleRollHistoryInput): RollHistoryEntry {
    const saveKey =
      input.clientSaveKey ??
      `${input.result.timestamp}:${input.result.tableId}:${input.result.entryId}:${input.result.roll}`;
    const existing = this.entriesState().find(
      (entry) => entry.type === 'oracle' && entry.label === saveKey,
    );
    if (existing) return cloneEntry(existing);

    this.oracleSaveKeys.add(saveKey);
    const entry: RollHistoryEntry = {
      ...createDomainEntity({
        id: `roll-history-${this.nextId++}`,
        createdAt: input.result.timestamp,
      }),
      type: 'oracle',
      source: 'generated',
      oracleTableId: input.result.tableId,
      oracleEntryId: input.result.entryId,
      outcome: 'oracle_result',
      label: saveKey,
      oracleRoll: {
        roll: input.result.roll,
        tableId: input.result.tableId,
        tableName: input.result.tableName,
        tableKind: input.result.tableKind,
        entryId: input.result.entryId,
        entryRange: { ...input.result.entryRange },
        resultText: input.result.text,
        resultTextRef: input.result.textRef,
        resolvedAt: input.result.timestamp,
        questionContext: input.result.questionContext,
        provenance: { ...input.result.provenance },
        tableProvenance: { ...input.result.tableProvenance },
      },
      isMatch: false,
      notes: input.note?.trim() || undefined,
    };

    this.entriesState.update((entries) => [...entries, entry]);
    this.autosave.markCommittedChange('rollHistory');
    void this.persistence.saveHistory(this.entriesState().map((entry) => cloneEntry(entry)));
    return cloneEntry(entry);
  }

  finalizeActionRollMomentumBurn(input: FinalizeActionRollMomentumBurnInput): RollHistoryEntry {
    const current = input.id
      ? this.entriesState().find((entry) => entry.id === input.id)
      : undefined;
    if (current?.momentumBurn?.applied) {
      return cloneEntry(current);
    }

    if (current) {
      const updated: RollHistoryEntry = {
        ...current,
        outcome: input.finalOutcome,
        momentumBurn: input.momentumBurn,
      };
      this.entriesState.update((entries) =>
        entries.map((entry) => (entry.id === current.id ? updated : entry)),
      );
      this.autosave.markCommittedChange('rollHistory');
      void this.persistence.saveHistory(this.entriesState().map((entry) => cloneEntry(entry)));
      return cloneEntry(updated);
    }

    const created = this.saveActionRoll({ prepared: input.prepared, result: input.result });
    const updated: RollHistoryEntry = {
      ...created,
      outcome: input.finalOutcome,
      momentumBurn: input.momentumBurn,
    };
    this.entriesState.update((entries) =>
      entries.map((entry) => (entry.id === created.id ? updated : entry)),
    );
    this.autosave.markCommittedChange('rollHistory');
    void this.persistence.saveHistory(this.entriesState().map((entry) => cloneEntry(entry)));
    return cloneEntry(updated);
  }

  async loadSavedHistory(): Promise<RollHistoryLoadResult> {
    const result = await this.persistence.loadHistory();
    if (result.success && result.found) {
      this.restoreEntries(result.entries);
    }
    return result;
  }

  async persistCurrentHistory(): Promise<SaveResult> {
    this.autosave.markCommittedChange('rollHistory');
    return this.persistence.saveHistory(this.entriesState().map((entry) => cloneEntry(entry)));
  }

  restoreEntries(entries: readonly RollHistoryEntry[]): void {
    const seen = new Set<string>();
    const restored: RollHistoryEntry[] = [];
    for (const entry of entries) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      restored.push(cloneEntry(entry));
    }
    this.entriesState.set(restored);
    this.rebuildDerivedState(restored);
  }

  clear(): void {
    this.entriesState.set([]);
    this.nextId = 1;
    this.oracleSaveKeys.clear();
    this.progressSaveKeys.clear();
  }

  private rebuildDerivedState(entries: readonly RollHistoryEntry[]): void {
    this.oracleSaveKeys.clear();
    this.progressSaveKeys.clear();
    let maxNumericId = 0;
    for (const entry of entries) {
      const match = /^roll-history-(\d+)$/.exec(entry.id);
      if (match) maxNumericId = Math.max(maxNumericId, Number(match[1]));
      if (entry.type === 'oracle' && entry.label) this.oracleSaveKeys.add(entry.label);
      if (entry.type === 'progress' && entry.label) this.progressSaveKeys.add(entry.label);
    }
    this.nextId = maxNumericId + 1;
  }
}
