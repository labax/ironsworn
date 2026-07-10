import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  CharacterDraftService,
  type CharacterCreationInput,
  type StatusTrackKey,
  MOMENTUM_MINIMUM,
  buildMomentumPatch,
  validateMomentumState,
} from '@app/domain/character';
import type { MomentumState, StatKey } from '@app/domain/character/character';

const statKeys: readonly StatKey[] = ['edge', 'heart', 'iron', 'shadow', 'wits'];
const standardStartingSpread = [3, 2, 2, 1, 1] as const;
const statusTrackMinimum = 0;
const statusTrackMaximum = 5;

const wholeNumber = (control: AbstractControl): ValidationErrors | null =>
  Number.isInteger(control.value) ? null : { wholeNumber: true };

const numberRange = (min: number, max: number) => [
  Validators.required,
  wholeNumber,
  Validators.min(min),
  Validators.max(max),
];

const defaultCharacterForm: CharacterCreationInput = {
  name: '',
  concept: '',
  edge: 1,
  heart: 1,
  iron: 1,
  shadow: 1,
  wits: 1,
  health: 5,
  spirit: 5,
  supply: 5,
  momentum: 2,
};

@Component({
  selector: 'app-character',
  imports: [ReactiveFormsModule],
  templateUrl: './character.html',
  styleUrl: './character.css',
})
export class Character {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  protected readonly characterDraft = inject(CharacterDraftService);
  private readonly editButton = viewChild<ElementRef<HTMLButtonElement>>('editButton');
  private readonly editNameInput = viewChild<ElementRef<HTMLInputElement>>('editNameInput');

  protected readonly savedCharacter = this.characterDraft.character;
  protected readonly hasCharacter = computed(() => this.savedCharacter() !== null);
  protected editingIdentityStats = false;
  protected readonly statusTrackOverrides: Record<StatusTrackKey, boolean> = {
    health: false,
    spirit: false,
    supply: false,
  };
  protected readonly statusTrackMessages: Partial<Record<StatusTrackKey, string>> = {};
  protected momentumMessage = '';
  protected momentumOverride = false;
  protected readonly statusAnnouncement = computed(() => {
    const character = this.savedCharacter();
    if (!character) return '';

    return `Health ${character.statusTracks.health}, Spirit ${character.statusTracks.spirit}, Supply ${character.statusTracks.supply}.`;
  });
  protected readonly momentumAnnouncement = computed(() => {
    const momentum = this.savedCharacter()?.momentum;
    if (!momentum) return '';

    return `Momentum ${momentum.current}, reset ${momentum.reset}, maximum ${momentum.max}.`;
  });
  protected readonly saveErrorMessage = computed(() => {
    const result = this.characterDraft.lastSaveResult();
    return result?.success === false ? result.error.message : 'Unable to save character.';
  });

  protected readonly statFields = [
    { key: 'edge', label: 'Edge' },
    { key: 'heart', label: 'Heart' },
    { key: 'iron', label: 'Iron' },
    { key: 'shadow', label: 'Shadow' },
    { key: 'wits', label: 'Wits' },
  ] as const;

  protected readonly statusFields = [
    { key: 'health', label: 'Health', min: 0, max: 5 },
    { key: 'spirit', label: 'Spirit', min: 0, max: 5 },
    { key: 'supply', label: 'Supply', min: 0, max: 5 },
    { key: 'momentum', label: 'Momentum', min: -6, max: 10 },
  ] as const;

  protected readonly playableStatusFields = [
    { key: 'health', label: 'Health' },
    { key: 'spirit', label: 'Spirit' },
    { key: 'supply', label: 'Supply' },
  ] as const;

  protected readonly characterForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    concept: [''],
    edge: [defaultCharacterForm.edge, numberRange(0, 5)],
    heart: [defaultCharacterForm.heart, numberRange(0, 5)],
    iron: [defaultCharacterForm.iron, numberRange(0, 5)],
    shadow: [defaultCharacterForm.shadow, numberRange(0, 5)],
    wits: [defaultCharacterForm.wits, numberRange(0, 5)],
    health: [defaultCharacterForm.health, numberRange(0, 5)],
    spirit: [defaultCharacterForm.spirit, numberRange(0, 5)],
    supply: [defaultCharacterForm.supply, numberRange(0, 5)],
    momentum: [defaultCharacterForm.momentum, numberRange(-6, 10)],
  });

  protected readonly identityStatsForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    concept: [''],
    edge: [defaultCharacterForm.edge, numberRange(0, 5)],
    heart: [defaultCharacterForm.heart, numberRange(0, 5)],
    iron: [defaultCharacterForm.iron, numberRange(0, 5)],
    shadow: [defaultCharacterForm.shadow, numberRange(0, 5)],
    wits: [defaultCharacterForm.wits, numberRange(0, 5)],
  });

  protected usesStandardSpread(): boolean {
    const values = statKeys.map((key) => this.identityStatsForm.controls[key].value).sort();
    return values.join(',') === [...standardStartingSpread].sort().join(',');
  }

  constructor() {
    void this.characterDraft.loadSavedCharacter();
  }

  protected resetForm(): void {
    this.characterForm.reset(defaultCharacterForm);
  }

  protected saveCharacter(): void {
    if (this.characterForm.invalid) {
      this.characterForm.markAllAsTouched();
      return;
    }

    const formValue = this.characterForm.getRawValue();
    this.characterDraft.save({
      ...formValue,
      name: formValue.name.trim(),
      concept: formValue.concept.trim(),
    });
  }

  protected openIdentityStatsEditor(): void {
    const character = this.savedCharacter();
    if (!character) return;

    this.identityStatsForm.reset({
      name: character.name,
      concept: character.concept ?? '',
      edge: character.stats.edge,
      heart: character.stats.heart,
      iron: character.stats.iron,
      shadow: character.stats.shadow,
      wits: character.stats.wits,
    });
    this.editingIdentityStats = true;
    queueMicrotask(() => this.editNameInput()?.nativeElement.focus());
  }

  protected cancelIdentityStatsEditor(): void {
    this.editingIdentityStats = false;
    this.identityStatsForm.markAsPristine();
    queueMicrotask(() => this.editButton()?.nativeElement.focus());
  }

  protected statusTrackValue(key: StatusTrackKey): number {
    return this.savedCharacter()?.statusTracks[key] ?? statusTrackMaximum;
  }

  protected momentumValue(): MomentumState {
    return this.savedCharacter()?.momentum ?? { current: 2, reset: 2, max: 10, hasOverride: false };
  }

  protected canDecreaseMomentum(): boolean {
    const momentum = this.momentumValue();
    return momentum.hasOverride || momentum.current > MOMENTUM_MINIMUM;
  }

  protected canIncreaseMomentum(): boolean {
    const momentum = this.momentumValue();
    return momentum.hasOverride || momentum.current < momentum.max;
  }

  protected updateMomentumOverride(event: Event): void {
    this.momentumOverride = (event.target as HTMLInputElement).checked;
    this.saveMomentumPatch({ hasOverride: this.momentumOverride });
  }

  protected adjustMomentum(delta: number): void {
    const momentum = this.momentumValue();
    this.saveMomentumPatch({ current: momentum.current + delta });
  }

  protected resetMomentumToReset(): void {
    this.saveMomentumPatch({ current: this.momentumValue().reset });
  }

  protected commitMomentumInput(
    field: keyof Pick<MomentumState, 'current' | 'reset' | 'max'>,
    event: Event,
  ): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);

    if (!Number.isInteger(value)) {
      this.momentumMessage = 'Enter a whole number.';
      input.value = String(this.momentumValue()[field]);
      return;
    }

    this.saveMomentumPatch({ [field]: value });
  }

  protected handleMomentumKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.adjustMomentum(1);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.adjustMomentum(-1);
    }
  }

  private saveMomentumPatch(patch: Partial<MomentumState>): void {
    const next = buildMomentumPatch(this.momentumValue(), patch);
    const validation = validateMomentumState(next, { allowOverride: next.hasOverride });

    if (!validation.valid) {
      this.momentumMessage = validation.message ?? 'Momentum values are invalid.';
      return;
    }

    const updated = this.characterDraft.updateMomentum(next);
    this.momentumOverride = next.hasOverride;
    this.momentumMessage = updated
      ? 'Momentum saved.'
      : 'No active character is available to update.';
  }

  protected canDecreaseStatusTrack(key: StatusTrackKey): boolean {
    return this.statusTrackValue(key) > statusTrackMinimum;
  }

  protected canIncreaseStatusTrack(key: StatusTrackKey): boolean {
    return this.statusTrackValue(key) < statusTrackMaximum;
  }

  protected updateStatusTrackOverride(key: StatusTrackKey, event: Event): void {
    this.statusTrackOverrides[key] = (event.target as HTMLInputElement).checked;
    this.statusTrackMessages[key] = this.statusTrackOverrides[key]
      ? 'Override enabled. Values above 5 can be saved for variants or corrections.'
      : undefined;
  }

  protected adjustStatusTrack(key: StatusTrackKey, delta: number): void {
    const nextValue = this.statusTrackValue(key) + delta;
    if (nextValue < statusTrackMinimum || nextValue > statusTrackMaximum) {
      this.statusTrackMessages[key] = 'Use manual override to save values outside 0 to 5.';
      return;
    }

    this.saveStatusTrackValue(key, nextValue);
  }

  protected commitStatusTrackInput(key: StatusTrackKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);

    if (!Number.isInteger(value)) {
      this.statusTrackMessages[key] = 'Enter a whole number.';
      input.value = String(this.statusTrackValue(key));
      return;
    }

    if (value < statusTrackMinimum) {
      this.statusTrackMessages[key] = 'Status tracks cannot be below 0.';
      input.value = String(this.statusTrackValue(key));
      return;
    }

    if (value > statusTrackMaximum && !this.statusTrackOverrides[key]) {
      this.statusTrackMessages[key] = 'Turn on manual override before saving a value above 5.';
      input.value = String(this.statusTrackValue(key));
      return;
    }

    this.saveStatusTrackValue(key, value);
  }

  protected handleStatusTrackKeydown(key: StatusTrackKey, event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.adjustStatusTrack(key, 1);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.adjustStatusTrack(key, -1);
    }
  }

  private saveStatusTrackValue(key: StatusTrackKey, value: number): void {
    const updated = this.characterDraft.updateStatusTrack(key, value);
    this.statusTrackMessages[key] = updated
      ? `${this.playableStatusFields.find((field) => field.key === key)?.label} set to ${value}.`
      : 'No active character is available to update.';
  }

  protected saveIdentityStats(): void {
    if (this.identityStatsForm.invalid) {
      this.identityStatsForm.markAllAsTouched();
      return;
    }

    const formValue = this.identityStatsForm.getRawValue();
    const updated = this.characterDraft.updateIdentityAndStats({
      name: formValue.name.trim(),
      concept: formValue.concept.trim(),
      stats: {
        edge: formValue.edge,
        heart: formValue.heart,
        iron: formValue.iron,
        shadow: formValue.shadow,
        wits: formValue.wits,
      },
    });

    if (updated) {
      this.editingIdentityStats = false;
      queueMicrotask(() => this.editButton()?.nativeElement.focus());
    }
  }

  protected showError(controlName: keyof typeof this.characterForm.controls): boolean {
    const control = this.characterForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected showEditError(controlName: keyof typeof this.identityStatsForm.controls): boolean {
    const control = this.identityStatsForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
