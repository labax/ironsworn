import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { JournalEntry, JournalSnapshot, JournalSourceReference } from '@app/domain/journal';
import { RollHistoryService, type RollHistoryEntry } from '@app/domain/rolls';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import type { ValidationError } from '@app/rules/validation';
import { JournalHandoffService } from './journal-handoff.service';

type EditorMode = 'create' | 'edit';

@Component({
  selector: 'app-journal',
  imports: [ReactiveFormsModule],
  templateUrl: './journal.html',
  styleUrl: './journal.css',
})
export class Journal {
  private readonly workspace = inject(CampaignWorkspaceService);
  private readonly rollHistory = inject(RollHistoryService);
  private readonly handoffs = inject(JournalHandoffService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly entries = this.workspace.journalEntries;
  protected readonly selectedEntryId = signal<string | undefined>(undefined);
  protected readonly selectedEntry = computed<JournalEntry | undefined>(() => {
    const selectedId = this.selectedEntryId();
    return this.entries().find((entry) => entry.id === selectedId) ?? this.entries()[0];
  });
  protected readonly isLoading = computed(() => this.workspace.loadStatus() === 'loading');
  protected readonly loadError = computed(() =>
    this.workspace.loadFailed()
      ? (this.workspace.lastLoadError()?.message ?? 'Journal entries are unavailable.')
      : '',
  );
  protected readonly rollHandoffs = computed(() => this.rollHistory.entries().slice().reverse());
  protected readonly mode = signal<EditorMode>('create');
  protected readonly editingId = signal<string | undefined>(undefined);
  protected readonly attachedRoll = signal<RollHistoryEntry | undefined>(undefined);
  protected readonly errors = signal<readonly ValidationError[]>([]);
  protected readonly announcement = signal('');
  private readonly returnUrl = signal<string | undefined>(undefined);
  private saving = false;

  protected readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    sessionLabel: [''],
    body: [''],
  });

  constructor() {
    queueMicrotask(() => this.acceptPendingHandoff());
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.form.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  }

  protected startCreate(): void {
    if (!this.confirmDiscard()) return;
    this.mode.set('create');
    this.editingId.set(undefined);
    this.attachedRoll.set(undefined);
    this.errors.set([]);
    this.form.reset({ title: '', sessionLabel: '', body: '' });
    this.form.markAsPristine();
    this.focusTitle();
  }

  protected openEntry(entryId: string): void {
    const selected = this.workspace.selectJournalEntry(entryId);
    this.selectedEntryId.set(selected?.id);
    this.announcement.set(
      selected ? `Opened journal entry ${selected.title}.` : 'Journal entry was not found.',
    );
  }

  protected deleteEntry(entry: JournalEntry): void {
    if (!confirm(`Delete journal entry ${entry.title}?`)) return;
    const result = this.workspace.deleteJournalEntry(entry.id);
    this.announcement.set(
      result.ok ? `Deleted journal entry ${entry.title}.` : 'Journal entry was not deleted.',
    );
    if (this.selectedEntryId() === entry.id) this.selectedEntryId.set(this.entries()[0]?.id);
    if (this.editingId() === entry.id) this.startCreate();
  }

  protected editEntry(entry: JournalEntry): void {
    if (!this.confirmDiscard()) return;
    this.openEntry(entry.id);
    this.mode.set('edit');
    this.editingId.set(entry.id);
    this.attachedRoll.set(undefined);
    this.errors.set([]);
    this.form.reset({
      title: entry.title,
      sessionLabel: entry.sessionLabel ?? '',
      body: entry.body,
    });
    this.form.markAsPristine();
    this.focusTitle();
  }

  protected attachHandoff(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.attachedRoll.set(this.rollHandoffs().find((entry) => entry.id === id));
    if (id) this.form.markAsDirty();
  }

  protected save(): void {
    if (this.saving) return;
    this.saving = true;
    this.form.markAllAsTouched();
    const attached = this.attachedRoll();
    const result = this.workspace.saveJournalEntry({
      id: this.editingId(),
      title: this.form.controls.title.value,
      sessionLabel: this.form.controls.sessionLabel.value,
      body: this.form.controls.body.value,
      sourceReferences: attached ? [this.toSourceReference(attached)] : undefined,
      snapshots: attached ? [this.toSnapshot(attached)] : undefined,
    });
    if (!result.ok) {
      this.errors.set(result.errors);
      this.announcement.set('Journal entry was not saved. Review the title field.');
      this.saving = false;
      return;
    }
    this.errors.set([]);
    this.mode.set('edit');
    this.editingId.set(result.entry.id);
    this.attachedRoll.set(undefined);
    this.form.reset({
      title: result.entry.title,
      sessionLabel: result.entry.sessionLabel ?? '',
      body: result.entry.body,
    });
    this.form.markAsPristine();
    this.selectedEntryId.set(result.entry.id);
    this.announcement.set(`Saved journal entry ${result.entry.title}.`);
    this.saving = false;
    this.returnAfterHandoff();
  }

  protected cancel(): void {
    if (!this.confirmDiscard()) return;
    this.startCreate();
    this.announcement.set('Journal changes discarded.');
    this.returnAfterHandoff();
  }

  protected fieldError(field: string): string {
    const domainError = this.errors().find((error) => error.field === field)?.message;
    if (domainError) return domainError;
    const control = this.form.get(field);
    if (control?.touched && control.hasError('required')) return 'This field is required.';
    if (control?.touched && control.hasError('pattern')) return 'Enter visible text.';
    return '';
  }

  protected formatTimestamp(timestamp: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(timestamp),
    );
  }

  protected entryExcerpt(entry: JournalEntry): string {
    const normalized = entry.body.replace(/\s+/g, ' ').trim();
    if (!normalized) return 'No body text.';
    return normalized.length > 180 ? `${normalized.slice(0, 177)}…` : normalized;
  }

  protected sourceIndicator(entry: JournalEntry): string {
    const parts = [
      entry.sessionLabel ? `Session: ${entry.sessionLabel}` : '',
      entry.sourceReferences.length
        ? `${entry.sourceReferences.length} source link${entry.sourceReferences.length === 1 ? '' : 's'}`
        : '',
      entry.snapshots.length
        ? `${entry.snapshots.length} generated snapshot${entry.snapshots.length === 1 ? '' : 's'}`
        : '',
    ].filter(Boolean);
    return parts.join(' · ');
  }

  protected sourceHref(source: JournalSourceReference): string | undefined {
    const entry = this.rollHistory.entries().find((roll) => roll.id === source.id);
    if (!entry) return undefined;
    return source.type === 'oracle'
      ? `/oracles?source=${encodeURIComponent(source.id)}`
      : `/moves?source=${encodeURIComponent(source.id)}`;
  }

  protected vowHref(entry: JournalEntry): string | undefined {
    return entry.links.vowId ? `/vows?vow=${encodeURIComponent(entry.links.vowId)}` : undefined;
  }

  protected sourceState(source: JournalSourceReference): 'valid' | 'broken' {
    return this.rollHistory.entries().some((roll) => roll.id === source.id) ? 'valid' : 'broken';
  }

  protected snapshotDetails(snapshot: JournalSnapshot): readonly string[] {
    const roll = snapshot.roll;
    if (roll.oracleRoll)
      return [
        `Roll ${roll.oracleRoll.roll}`,
        roll.oracleRoll.resultText ??
          roll.oracleRoll.resultTextRef ??
          'Result preserved in snapshot',
      ];
    if (roll.actionRoll)
      return [
        `Action ${roll.actionRoll.actionDie}`,
        `Challenge ${roll.actionRoll.challengeDice[0]} / ${roll.actionRoll.challengeDice[1]}`,
        roll.outcome,
      ];
    if (roll.progressRoll)
      return [
        `Progress ${roll.progressRoll.progressScore}`,
        `Challenge ${roll.progressRoll.challengeDice[0]} / ${roll.progressRoll.challengeDice[1]}`,
        roll.outcome,
      ];
    return [roll.outcome];
  }

  protected snapshotLabel(snapshot: JournalSnapshot): string {
    return snapshot.roll.type === 'oracle'
      ? `Oracle snapshot: ${snapshot.roll.oracleRoll?.tableName ?? 'Oracle roll'} (${snapshot.roll.id})`
      : `Roll snapshot: ${snapshot.roll.label ?? snapshot.roll.type} (${snapshot.roll.id})`;
  }

  protected rollLabel(roll: RollHistoryEntry): string {
    if (roll.type === 'oracle') return `Oracle: ${roll.oracleRoll?.tableName ?? roll.id}`;
    return `Roll: ${roll.label ?? roll.id}`;
  }

  private toSourceReference(roll: RollHistoryEntry): JournalSourceReference {
    return {
      id: roll.id,
      type: roll.type === 'oracle' ? 'oracle' : 'roll',
      label: this.rollLabel(roll),
    };
  }

  private toSnapshot(roll: RollHistoryEntry): JournalSnapshot {
    return { type: roll.type === 'oracle' ? 'oracle' : 'roll', roll };
  }

  private acceptPendingHandoff(): void {
    const pending = this.handoffs.consume();
    if (!pending) return;
    this.mode.set('create');
    this.editingId.set(undefined);
    this.attachedRoll.set(pending.source);
    this.returnUrl.set(pending.returnUrl);
    this.form.reset({
      title:
        pending.source.type === 'oracle'
          ? `Oracle: ${pending.source.oracleRoll?.tableName ?? 'Result'}`
          : `Roll: ${pending.source.label ?? pending.source.id}`,
      sessionLabel: '',
      body: '',
    });
    this.form.markAsDirty();
    this.announcement.set(
      'Oracle snapshot attached. Review and add your own journal text before saving.',
    );
    this.focusTitle();
  }

  private returnAfterHandoff(): void {
    const url = this.returnUrl();
    this.returnUrl.set(undefined);
    if (url) void this.router.navigateByUrl(url).catch(() => undefined);
  }

  private confirmDiscard(): boolean {
    return !this.form.dirty || confirm('Discard unsaved journal changes?');
  }

  private focusTitle(): void {
    setTimeout(() => document.getElementById('journal-title')?.focus());
  }
}
