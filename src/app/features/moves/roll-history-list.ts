import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { RollHistoryService, type RollHistoryEntry, type RollOutcome } from '@app/domain/rolls';
import { JournalHandoffService } from '../journal/journal-handoff.service';

@Component({
  selector: 'app-roll-history-list',
  templateUrl: './roll-history-list.html',
  styleUrl: './roll-history-list.css',
})
export class RollHistoryList {
  private readonly rollHistory = inject(RollHistoryService);
  private readonly handoffs = inject(JournalHandoffService);
  private readonly router = inject(Router);

  protected readonly entries = computed(() => this.rollHistory.entries().slice().reverse());

  protected readonly actionRolls = computed(() =>
    this.entries().filter((entry) => entry.type === 'action' && entry.actionRoll),
  );

  protected resultLabel(outcome: RollOutcome): string {
    switch (outcome) {
      case 'strong_hit':
        return 'Strong hit';
      case 'weak_hit':
        return 'Weak hit';
      case 'miss':
        return 'Miss';
      case 'oracle_result':
        return 'Oracle result';
      default:
        return 'Other result';
    }
  }

  protected rollLabel(entry: RollHistoryEntry, index: number): string {
    if (entry.type === 'oracle') return entry.oracleRoll?.tableName ?? 'Oracle roll';
    if (entry.type === 'progress') return entry.progressRoll?.trackTitle ?? 'Progress roll';
    return entry.label?.trim() || `Action roll ${this.actionRolls().length - index}`;
  }

  protected progressSourceLink(entry: RollHistoryEntry): string | null {
    const progress = entry.progressRoll;
    if (!progress) return null;
    return progress.vowId ? `/vows` : `/trackers`;
  }

  protected sendToJournal(entry: RollHistoryEntry): void {
    this.handoffs.start(entry, '/moves');
    void this.router.navigateByUrl('/journal').catch(() => undefined);
  }

  protected createdAtLabel(entry: RollHistoryEntry): string {
    const date = new Date(entry.createdAt);
    if (Number.isNaN(date.getTime())) {
      return entry.createdAt;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }
}
