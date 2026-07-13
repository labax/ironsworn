import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  filterRollHistory,
  hasActiveRollHistoryFilters,
  RollHistoryService,
  type RollHistoryEntry,
  type RollHistoryFilters,
  type RollOutcome,
  type RollType,
} from '@app/domain/rolls';
import { JournalHandoffService } from '../journal/journal-handoff.service';

@Component({
  selector: 'app-roll-history-list',
  imports: [FormsModule],
  templateUrl: './roll-history-list.html',
  styleUrl: './roll-history-list.css',
})
export class RollHistoryList {
  private readonly rollHistory = inject(RollHistoryService);
  private readonly handoffs = inject(JournalHandoffService);
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly selectedTypes = signal<readonly RollType[]>([]);
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly sessionFrom = signal('');
  protected readonly sessionTo = signal('');

  protected readonly allEntries = computed(() => this.rollHistory.entries());
  protected readonly filters = computed<RollHistoryFilters>(() => ({
    query: this.query(),
    types: this.selectedTypes(),
    dateFrom: this.dateFrom(),
    dateTo: this.dateTo(),
    sessionFrom: this.sessionFrom(),
    sessionTo: this.sessionTo(),
  }));
  protected readonly entries = computed(() => filterRollHistory(this.allEntries(), this.filters()));
  protected readonly hasActiveFilters = computed(() => hasActiveRollHistoryFilters(this.filters()));

  protected readonly actionRolls = computed(() =>
    this.entries().filter((entry) => entry.type === 'action' && entry.actionRoll),
  );

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setDateFrom(value: string): void {
    this.dateFrom.set(value);
  }

  protected setDateTo(value: string): void {
    this.dateTo.set(value);
  }

  protected isTypeSelected(type: RollType): boolean {
    return this.selectedTypes().includes(type);
  }

  protected toggleType(type: RollType, checked: boolean): void {
    const current = this.selectedTypes();
    this.selectedTypes.set(
      checked ? [...current, type] : current.filter((candidate) => candidate !== type),
    );
  }

  protected resetFilters(): void {
    this.query.set('');
    this.selectedTypes.set([]);
    this.dateFrom.set('');
    this.dateTo.set('');
    this.sessionFrom.set('');
    this.sessionTo.set('');
  }

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
