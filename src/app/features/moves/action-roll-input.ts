import { Component, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActiveCharacterService, type StatKey } from '@app/domain/character';
import type { PreparedActionRollInput } from '@app/domain/rolls';

type RollInputSource = PreparedActionRollInput['source'];

const STAT_OPTIONS: readonly { key: StatKey; label: string }[] = [
  { key: 'edge', label: 'Edge' },
  { key: 'heart', label: 'Heart' },
  { key: 'iron', label: 'Iron' },
  { key: 'shadow', label: 'Shadow' },
  { key: 'wits', label: 'Wits' },
];

const DEFAULT_STAT_KEY: StatKey = 'edge';
const DEFAULT_ADDS = 0;
let sessionStatKey: StatKey = DEFAULT_STAT_KEY;

const integerPattern = /^-?\d+$/;

@Component({
  selector: 'app-action-roll-input',
  imports: [ReactiveFormsModule],
  templateUrl: './action-roll-input.html',
  styleUrl: './action-roll-input.css',
})
export class ActionRollInput {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly activeCharacter = inject(ActiveCharacterService);

  readonly prepared = output<PreparedActionRollInput>();

  protected readonly statOptions = STAT_OPTIONS;
  protected readonly characterSummary = this.activeCharacter.activeCharacterSummary;
  protected readonly hasCharacter = this.activeCharacter.hasActiveCharacter;
  protected readonly lastPreparedInput = signal<PreparedActionRollInput | null>(null);
  protected readonly selectedSource = signal<RollInputSource>('character-stat');
  protected readonly rollForm = this.formBuilder.group({
    label: [''],
    source: ['character-stat' as RollInputSource, [Validators.required]],
    statKey: [sessionStatKey, [Validators.required]],
    statValue: [
      1,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(5),
        Validators.pattern(integerPattern),
      ],
    ],
    adds: [
      DEFAULT_ADDS,
      [
        Validators.required,
        Validators.min(-5),
        Validators.max(5),
        Validators.pattern(integerPattern),
      ],
    ],
  });

  constructor() {
    if (!this.hasCharacter()) {
      this.rollForm.controls.source.setValue('manual');
      this.selectedSource.set('manual');
    }

    const selectedCharacterValue = this.getCharacterStatValue(this.rollForm.controls.statKey.value);
    if (selectedCharacterValue !== undefined) {
      this.rollForm.controls.statValue.setValue(selectedCharacterValue);
    }
  }

  protected selectSource(source: RollInputSource): void {
    this.rollForm.controls.source.setValue(source);
    this.selectedSource.set(source);
    if (source === 'character-stat') {
      this.syncSelectedStatValue();
    }
  }

  protected onStatSelectionChange(): void {
    sessionStatKey = this.rollForm.controls.statKey.value;
    this.syncSelectedStatValue();
  }

  protected resetInput(): void {
    const source: RollInputSource = this.hasCharacter() ? 'character-stat' : 'manual';
    this.selectedSource.set(source);
    this.rollForm.reset({
      label: '',
      source,
      statKey: sessionStatKey,
      statValue: this.getCharacterStatValue(sessionStatKey) ?? 1,
      adds: DEFAULT_ADDS,
    });
  }

  protected prepareRoll(): void {
    if (!this.hasCharacter() && this.rollForm.controls.source.value === 'character-stat') {
      this.rollForm.controls.source.setValue('manual');
      this.selectedSource.set('manual');
    }

    if (this.rollForm.invalid) {
      this.rollForm.markAllAsTouched();
      return;
    }

    const value = this.rollForm.getRawValue();
    const source = this.hasCharacter() ? value.source : 'manual';
    const statValue =
      source === 'character-stat'
        ? (this.getCharacterStatValue(value.statKey) ?? value.statValue)
        : value.statValue;

    const prepared: PreparedActionRollInput = {
      label: value.label.trim() || undefined,
      statKey: source === 'character-stat' ? value.statKey : undefined,
      statValue,
      adds: value.adds,
      source,
    };

    sessionStatKey = value.statKey;
    this.lastPreparedInput.set(prepared);
    this.prepared.emit(prepared);
  }

  protected showError(controlName: keyof typeof this.rollForm.controls): boolean {
    const control = this.rollForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private syncSelectedStatValue(): void {
    const statValue = this.getCharacterStatValue(this.rollForm.controls.statKey.value);
    if (statValue !== undefined) {
      this.rollForm.controls.statValue.setValue(statValue);
    }
  }

  private getCharacterStatValue(statKey: StatKey): number | undefined {
    return this.characterSummary()?.stats[statKey];
  }
}
