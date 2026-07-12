import { Component, computed, inject, signal } from '@angular/core';

import {
  oracleAvailabilityLabel,
  type BrowsableOracleTable,
  type OracleCategoryGroup,
} from '@domain/oracles';
import type { EntityId } from '@domain/shared';

import { OracleBrowserService } from './oracle-browser.service';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-oracles',
  templateUrl: './oracles.html',
  styleUrl: './oracles.css',
})
export class Oracles {
  private readonly oracleBrowser = inject(OracleBrowserService);
  protected readonly loadState = signal<LoadState>('loading');
  protected readonly groups = signal<readonly OracleCategoryGroup[]>([]);
  protected readonly selectedTableId = signal<EntityId | undefined>(undefined);
  protected readonly errorMessage = signal('');
  protected readonly selectedTable = computed(() => {
    const id = this.selectedTableId();
    if (!id) return undefined;
    for (const group of this.groups()) {
      const table = group.tables.find((candidate) => candidate.id === id);
      if (table) return table;
    }
    return undefined;
  });

  constructor() {
    void this.loadTables();
  }

  protected availabilityLabel(table: BrowsableOracleTable): string {
    return oracleAvailabilityLabel(table);
  }

  protected async loadTables(): Promise<void> {
    this.loadState.set('loading');
    this.errorMessage.set('');
    try {
      const snapshot = await this.oracleBrowser.loadApprovedTables();
      this.groups.set(snapshot.groups);
      this.selectedTableId.set(snapshot.tables[0]?.id);
      this.loadState.set('ready');
    } catch {
      this.groups.set([]);
      this.selectedTableId.set(undefined);
      this.errorMessage.set('Oracle tables could not be loaded. Try refreshing the page.');
      this.loadState.set('error');
    }
  }

  protected openTable(tableId: EntityId): void {
    const table = this.oracleBrowser.findApprovedTable(tableId);
    if (!table) return;
    this.selectedTableId.set(table.id);
  }
}
