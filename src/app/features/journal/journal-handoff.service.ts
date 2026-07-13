import { Injectable, signal } from '@angular/core';

import type { RollHistoryEntry } from '@app/domain/rolls';

export interface JournalHandoff {
  readonly source: RollHistoryEntry;
  readonly returnUrl: string;
}

const cloneHandoffSource = (entry: RollHistoryEntry): RollHistoryEntry => ({
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
export class JournalHandoffService {
  private readonly pendingState = signal<JournalHandoff | undefined>(undefined);
  readonly pending = this.pendingState.asReadonly();

  start(source: RollHistoryEntry, returnUrl: string): void {
    this.pendingState.set({ source: cloneHandoffSource(source), returnUrl });
  }

  consume(): JournalHandoff | undefined {
    const pending = this.pendingState();
    this.pendingState.set(undefined);
    return pending ? { ...pending, source: cloneHandoffSource(pending.source) } : undefined;
  }
}
