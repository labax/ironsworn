import { Component, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CharacterDraftService, type CharacterCreationInput } from '@app/domain/character';

const numberRange = (min: number, max: number) => [
  Validators.required,
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

  protected readonly savedCharacter = this.characterDraft.character;
  protected readonly hasCharacter = computed(() => this.savedCharacter() !== null);

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

  protected showError(controlName: keyof typeof this.characterForm.controls): boolean {
    const control = this.characterForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
