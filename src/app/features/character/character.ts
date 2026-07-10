import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { CharacterDraftService, type CharacterCreationInput } from '@app/domain/character';
import type { StatKey } from '@app/domain/character/character';

const statKeys: readonly StatKey[] = ['edge', 'heart', 'iron', 'shadow', 'wits'];
const standardStartingSpread = [3, 2, 2, 1, 1] as const;

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
