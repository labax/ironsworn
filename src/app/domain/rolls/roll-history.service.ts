import { Injectable, signal } from '@angular/core';

import { createDomainEntity, type ISODateString } from '../shared';
import type { PreparedActionRollInput, RollHistoryEntry } from './index';
import type { ActionRollResult } from '@app/rules';

export interface SaveActionRollHistoryInput {
  readonly prepared: PreparedActionRollInput;
  readonly result: ActionRollResult;
  readonly createdAt?: ISODateString;
  readonly note?: string;
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
  oracleRoll: entry.oracleRoll ? { ...entry.oracleRoll } : undefined,
  momentumBurn: entry.momentumBurn ? { ...entry.momentumBurn } : undefined,
});

@Injectable({ providedIn: 'root' })
export class RollHistoryService {
  private readonly entriesState = signal<readonly RollHistoryEntry[]>([]);
  private nextId = 1;

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
    return cloneEntry(entry);
  }

  clear(): void {
    this.entriesState.set([]);
    this.nextId = 1;
  }
}
