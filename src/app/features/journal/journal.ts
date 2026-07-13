import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { JournalEntry, JournalSnapshot, JournalSourceReference } from '@app/domain/journal';
import { RollHistoryService, type RollHistoryEntry } from '@app/domain/rolls';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import type { ValidationError } from '@app/rules/validation';

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
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly entries = this.workspace.journalEntries;
  protected readonly rollHandoffs = computed(() => this.rollHistory.entries().slice().reverse());
  protected readonly mode = signal<EditorMode>('create');
  protected readonly editingId = signal<string | undefined>(undefined);
  protected readonly attachedRoll = signal<RollHistoryEntry | undefined>(undefined);
  protected readonly errors = signal<readonly ValidationError[]>([]);
  protected readonly announcement = signal('');

  protected readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    sessionLabel: [''],
    body: [''],
  });

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

  protected editEntry(entry: JournalEntry): void {
    if (!this.confirmDiscard()) return;
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
    this.announcement.set(`Saved journal entry ${result.entry.title}.`);
  }

  protected cancel(): void {
    if (!this.confirmDiscard()) return;
    this.startCreate();
    this.announcement.set('Journal changes discarded.');
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

  private confirmDiscard(): boolean {
    return !this.form.dirty || confirm('Discard unsaved journal changes?');
  }

  private focusTitle(): void {
    setTimeout(() => document.getElementById('journal-title')?.focus());
  }
}
