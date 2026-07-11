import { Injectable, signal } from '@angular/core';

import { createDomainEntity, type ISODateString } from '../shared';
import type { MomentumBurn, PreparedActionRollInput, RollHistoryEntry } from './index';
import type { ActionRollResult } from '@app/rules';

export interface SaveActionRollHistoryInput {
  readonly prepared: PreparedActionRollInput;
  readonly result: ActionRollResult;
  readonly createdAt?: ISODateString;
  readonly note?: string;
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
  oracleRoll: entry.oracleRoll ? { ...entry.oracleRoll } : undefined,
  momentumBurn: entry.momentumBurn
    ? { ...entry.momentumBurn, canceledDice: [...entry.momentumBurn.canceledDice] }
    : undefined,
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
    return cloneEntry(updated);
  }

  clear(): void {
    this.entriesState.set([]);
    this.nextId = 1;
  }
}
