import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  filterOracleTablesForDiscovery,
  groupOracleTablesByCategory,
  oracleAvailabilityLabel,
  oracleSourceLabel,
  type BrowsableOracleTable,
  type OracleCategoryGroup,
  type OracleSourceFilter,
} from '@domain/oracles';
import { CampaignWorkspaceService } from '@domain/services/campaign-workspace.service';
import type { EntityId } from '@domain/shared';
import { resolveOracleTableRoll, type ResolvedOracleTableResult } from '@app/rules/oracles';
import type { ValidationError } from '@app/rules/validation';

import { OracleBrowserService } from './oracle-browser.service';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-oracles',
  imports: [ReactiveFormsModule],
  templateUrl: './oracles.html',
  styleUrl: './oracles.css',
})
export class Oracles {
  private readonly oracleBrowser = inject(OracleBrowserService);
  private readonly workspace = inject(CampaignWorkspaceService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  protected readonly loadState = signal<LoadState>('loading');
  private readonly allTables = signal<readonly BrowsableOracleTable[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly categoryFilter = signal('');
  protected readonly sourceFilter = signal<OracleSourceFilter>('all');
  protected readonly groups = computed<readonly OracleCategoryGroup[]>(() =>
    groupOracleTablesByCategory(
      filterOracleTablesForDiscovery(this.allTables(), {
        query: this.searchQuery(),
        category: this.categoryFilter(),
        source: this.sourceFilter(),
      }),
    ),
  );
  protected readonly tableCount = computed(() => this.allTables().length);
  protected readonly filteredTables = computed(() =>
    this.groups().flatMap((group) => group.tables),
  );
  protected readonly hasDiscoveryFilters = computed(
    () =>
      Boolean(this.searchQuery().trim()) ||
      Boolean(this.categoryFilter()) ||
      this.sourceFilter() !== 'all',
  );
  protected readonly categoryOptions = computed(() =>
    [...new Set(this.allTables().map((table) => table.category))].sort((a, b) =>
      a.localeCompare(b),
    ),
  );
  protected readonly sourceOptions = computed(() =>
    [
      ...new Set(this.allTables().map((table) => table.sourceType ?? table.provenance.category)),
    ].sort((a, b) => oracleSourceLabel(a).localeCompare(oracleSourceLabel(b))),
  );
  protected readonly selectedTableId = signal<EntityId | undefined>(undefined);
  protected readonly errorMessage = signal('');
  protected readonly validationErrors = signal<readonly ValidationError[]>([]);
  protected readonly rollResult = signal<ResolvedOracleTableResult | undefined>(undefined);
  protected readonly deleteTarget = signal<BrowsableOracleTable | undefined>(undefined);
  protected readonly selectedTable = computed(() => {
    const id = this.selectedTableId();
    if (!id) return undefined;
    return this.allTables().find((candidate) => candidate.id === id);
  });
  protected readonly isSelectedCustom = computed(
    () => this.selectedTable()?.provenance.category === 'custom',
  );

  protected readonly form = this.formBuilder.group({
    id: [''],
    name: ['', Validators.required],
    category: ['', Validators.required],
    description: [''],
    rollMin: [1, Validators.required],
    rollMax: [6, Validators.required],
    entries: this.formBuilder.array([
      this.formBuilder.group({
        id: [''],
        min: [1, Validators.required],
        max: [6, Validators.required],
        text: ['', Validators.required],
      }),
    ]),
  });

  protected get entries(): FormArray {
    return this.form.controls.entries;
  }

  constructor() {
    void this.loadTables();
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.form.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  }

  protected availabilityLabel(table: BrowsableOracleTable): string {
    return oracleAvailabilityLabel(table);
  }

  protected sourceLabel(source: OracleSourceFilter): string {
    return oracleSourceLabel(source);
  }

  protected updateSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected updateCategoryFilter(event: Event): void {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }

  protected updateSourceFilter(event: Event): void {
    this.sourceFilter.set((event.target as HTMLSelectElement).value as OracleSourceFilter);
  }

  protected resetDiscoveryFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set('');
    this.sourceFilter.set('all');
    this.selectedTableId.set(this.allTables()[0]?.id);
  }

  protected async loadTables(): Promise<void> {
    this.loadState.set('loading');
    this.errorMessage.set('');
    try {
      const snapshot = await this.oracleBrowser.loadApprovedTables();
      this.allTables.set(snapshot.tables);
      this.selectedTableId.set(this.selectedTableId() ?? snapshot.tables[0]?.id);
      this.loadState.set('ready');
    } catch {
      this.allTables.set([]);
      this.selectedTableId.set(undefined);
      this.errorMessage.set('Oracle tables could not be loaded. Try refreshing the page.');
      this.loadState.set('error');
    }
  }

  protected openTable(tableId: EntityId): void {
    if (!this.confirmDiscard()) return;
    const table = this.allTables().find((candidate) => candidate.id === tableId);
    if (!table) return;
    this.selectedTableId.set(table.id);
    this.rollResult.set(undefined);
  }

  protected addEntry(): void {
    const index = this.entries.length + 1;
    this.entries.push(
      this.formBuilder.group({
        id: [''],
        min: [index, Validators.required],
        max: [index, Validators.required],
        text: ['', Validators.required],
      }),
    );
    this.form.markAsDirty();
  }

  protected removeEntry(index: number): void {
    this.entries.removeAt(index);
    this.form.markAsDirty();
  }

  protected editSelected(): void {
    const table = this.selectedTable();
    if (!table || table.provenance.category !== 'custom') return;
    this.entries.clear();
    for (const entry of table.entries) {
      this.entries.push(
        this.formBuilder.group({
          id: [entry.id],
          min: [entry.range.min, Validators.required],
          max: [entry.range.max, Validators.required],
          text: [entry.text ?? '', Validators.required],
        }),
      );
    }
    this.form.patchValue({
      id: table.id,
      name: table.name,
      category: table.category,
      description: table.description,
      rollMin: table.rollRange.min,
      rollMax: table.rollRange.max,
    });
    this.form.markAsPristine();
  }

  protected saveCustomTable(): void {
    const result = this.workspace.saveCustomOracleTable(this.form.getRawValue());
    if (!result.ok) {
      this.validationErrors.set(result.errors);
      return;
    }
    this.validationErrors.set([]);
    this.form.reset({
      id: result.table.id,
      name: result.table.name,
      category: result.table.category,
      description: result.table.description,
      rollMin: result.table.rollRange.min,
      rollMax: result.table.rollRange.max,
    });
    this.form.markAsPristine();
    this.selectedTableId.set(result.table.id);
    void this.loadTables();
  }

  protected rollSelected(): void {
    const table = this.selectedTable();
    if (!table) return;
    const result = resolveOracleTableRoll({ table });
    if (!result.ok) {
      this.validationErrors.set(result.errors);
      return;
    }
    this.validationErrors.set([]);
    this.rollResult.set(result.value);
  }

  protected requestDeleteSelected(): void {
    const table = this.selectedTable();
    if (table?.provenance.category === 'custom') this.deleteTarget.set(table);
  }

  protected cancelDelete(): void {
    this.deleteTarget.set(undefined);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.workspace.deleteCustomOracleTable(target.id);
    this.deleteTarget.set(undefined);
    this.selectedTableId.set(undefined);
    void this.loadTables();
  }

  protected fieldErrors(field: string): string {
    return this.validationErrors()
      .filter((error) => error.field === field || error.field?.startsWith(`${field}.`))
      .map((error) => error.message)
      .join(' ');
  }

  private confirmDiscard(): boolean {
    return !this.form.dirty || confirm('Discard unsaved custom oracle changes?');
  }
}
