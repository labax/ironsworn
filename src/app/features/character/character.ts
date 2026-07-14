import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
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
import { OnboardingStateService } from '@app/domain/onboarding';
import { Router } from '@angular/router';
import type {
  AssetReference,
  Bond,
  CharacterDebility,
  CharacterExperience,
  DebilityCategory,
  DebilityType,
  MomentumState,
  StatKey,
} from '@app/domain/character/character';
import { deriveMomentumValuesFromDebilities } from '@app/rules/momentum';

const statKeys: readonly StatKey[] = ['edge', 'heart', 'iron', 'shadow', 'wits'];

interface DebilityOption {
  readonly id: DebilityType;
  readonly label: string;
  readonly category: DebilityCategory;
}

interface DebilityGroup {
  readonly category: DebilityCategory;
  readonly label: string;
  readonly options: readonly DebilityOption[];
}

const debilityGroups: readonly DebilityGroup[] = [
  {
    category: 'condition',
    label: 'Conditions',
    options: [
      { id: 'wounded', label: 'Wounded', category: 'condition' },
      { id: 'shaken', label: 'Shaken', category: 'condition' },
      { id: 'unprepared', label: 'Unprepared', category: 'condition' },
    ],
  },
  {
    category: 'bane',
    label: 'Banes',
    options: [
      { id: 'maimed', label: 'Maimed', category: 'bane' },
      { id: 'corrupted', label: 'Corrupted', category: 'bane' },
    ],
  },
  {
    category: 'burden',
    label: 'Burdens',
    options: [
      { id: 'cursed', label: 'Cursed', category: 'burden' },
      { id: 'tormented', label: 'Tormented', category: 'burden' },
    ],
  },
];

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
  private readonly onboarding = inject(OnboardingStateService);
  private readonly router = inject(Router);
  private readonly editButton = viewChild<ElementRef<HTMLButtonElement>>('editButton');
  private readonly editNameInput = viewChild<ElementRef<HTMLInputElement>>('editNameInput');
  private readonly addBondButton = viewChild<ElementRef<HTMLButtonElement>>('addBondButton');
  private readonly addAssetButton = viewChild<ElementRef<HTMLButtonElement>>('addAssetButton');
  private readonly assetNameInput = viewChild<ElementRef<HTMLInputElement>>('assetNameInput');
  private readonly bondNameInput = viewChild<ElementRef<HTMLInputElement>>('bondNameInput');

  protected readonly savedCharacter = this.characterDraft.character;
  protected readonly hasCharacter = computed(() => this.savedCharacter() !== null);
  private readonly onboardingInProgress = signal(false);
  protected readonly canContinueOnboarding = computed(
    () => this.hasCharacter() && this.onboardingInProgress(),
  );
  protected editingIdentityStats = false;
  protected readonly statusTrackOverrides: Record<StatusTrackKey, boolean> = {
    health: false,
    spirit: false,
    supply: false,
  };
  protected readonly statusTrackMessages: Partial<Record<StatusTrackKey, string>> = {};
  protected momentumMessage = '';
  protected debilityMessage = '';
  protected momentumOverride = false;
  protected editingBondId: string | null = null;
  protected editingAssetId: string | null = null;
  protected assetMessage = '';
  protected bondMessage = '';
  protected experienceMessage = '';
  protected equipmentNotesMessage = '';
  protected characterNotesMessage = '';
  protected experienceManualOverride = false;
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

  protected readonly debilityGroups = debilityGroups;
  protected readonly statusFields = [
    { key: 'health', label: 'Health', min: 0, max: 5 },
    { key: 'spirit', label: 'Spirit', min: 0, max: 5 },
    { key: 'supply', label: 'Supply', min: 0, max: 5 },
    { key: 'momentum', label: 'Momentum', min: -6, max: 10 },
  ] as const;

  protected readonly experienceAnnouncement = computed(() => {
    const experience = this.experienceValue();
    return `Experience earned ${experience.earned}, spent ${experience.spent}, available ${this.availableExperience()}.`;
  });

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

  protected readonly bondForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
  });

  protected readonly assetForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    category: [''],
    source: [''],
    notes: [''],
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
    void this.refreshOnboardingProgress();
  }

  private async refreshOnboardingProgress(): Promise<void> {
    this.onboardingInProgress.set(await this.onboarding.isInProgress());
  }

  protected resetForm(): void {
    this.characterForm.reset(defaultCharacterForm);
  }

  protected async continueOnboarding(): Promise<void> {
    if (!this.canContinueOnboarding()) return;
    await this.router.navigate([this.onboarding.nextStep('character').path]);
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

  protected markedDebilityCount(): number {
    return this.savedCharacter()?.debilities.length ?? 0;
  }

  protected experienceValue(): CharacterExperience {
    return this.savedCharacter()?.experience ?? { earned: 0, spent: 0 };
  }

  protected availableExperience(): number {
    const experience = this.experienceValue();
    return experience.earned - experience.spent;
  }

  protected hasExperienceOverspend(): boolean {
    return this.availableExperience() < 0;
  }

  protected isExperienceOverrideAllowed(): boolean {
    return this.experienceManualOverride || this.hasExperienceOverspend();
  }

  protected updateExperienceOverride(event: Event): void {
    this.experienceManualOverride = (event.target as HTMLInputElement).checked;
    this.experienceMessage = this.experienceManualOverride
      ? 'Manual correction enabled for spent above earned.'
      : this.hasExperienceOverspend()
        ? 'Lower spent or enable correction before changing experience.'
        : '';
  }

  protected adjustExperience(field: keyof CharacterExperience, delta: number): void {
    this.saveExperienceValue(field, this.experienceValue()[field] + delta);
  }

  protected commitExperienceInput(field: keyof CharacterExperience, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);

    if (!Number.isInteger(value)) {
      this.experienceMessage = 'Enter a whole number.';
      input.value = String(this.experienceValue()[field]);
      return;
    }

    this.saveExperienceValue(field, value);
    input.value = String(this.experienceValue()[field]);
  }

  protected handleExperienceKeydown(field: keyof CharacterExperience, event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.adjustExperience(field, 1);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.adjustExperience(field, -1);
    }
  }

  private saveExperienceValue(field: keyof CharacterExperience, value: number): void {
    if (value < 0) {
      this.experienceMessage = 'Experience cannot be below 0.';
      return;
    }

    const next = { ...this.experienceValue(), [field]: value };

    if (next.spent > next.earned && !this.isExperienceOverrideAllowed()) {
      this.experienceMessage = 'Spent exceeds earned. Enable manual correction to save.';
      return;
    }

    const updated = this.characterDraft.updateExperience(next);
    this.experienceMessage = updated
      ? next.spent > next.earned
        ? 'Experience saved with manual correction.'
        : 'Experience saved.'
      : 'No active character is available to update.';
  }

  protected isDebilityMarked(id: DebilityType): boolean {
    return this.savedCharacter()?.debilities.some((debility) => debility.type === id) ?? false;
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
    const checked = (event.target as HTMLInputElement).checked;

    if (!checked) {
      this.returnMomentumToDerived();
      return;
    }

    this.momentumOverride = true;
    this.saveMomentumPatch({ hasOverride: true });
  }

  protected toggleDebility(option: DebilityOption, event: Event): void {
    const input = event.target as HTMLInputElement;
    const character = this.savedCharacter();
    if (!character) return;

    const marked = character.debilities.some((debility) => debility.type === option.id);
    const debilities = marked
      ? character.debilities.filter((debility) => debility.type !== option.id)
      : [
          ...character.debilities,
          {
            id: option.id,
            type: option.id,
            category: option.category,
            label: option.label,
          },
        ];
    const derived = deriveMomentumValuesFromDebilities(debilities);
    let momentum: MomentumState = { ...character.momentum };

    if (momentum.hasOverride) {
      const useDerived = confirm(
        'Momentum is in manual override mode. Return to standard derived Momentum for this debility change?',
      );
      if (useDerived) {
        momentum = {
          ...momentum,
          ...derived,
          hasOverride: false,
          current: Math.min(momentum.current, derived.max),
        };
      }
    } else {
      if (momentum.current > derived.max) {
        const applyClamp = confirm(
          `${option.label} changes Maximum Momentum to ${derived.max}. Current Momentum ${momentum.current} will be lowered to ${derived.max}. Continue?`,
        );
        if (!applyClamp) {
          input.checked = marked;
          this.debilityMessage = 'Debility change canceled; Momentum was unchanged.';
          return;
        }
      }
      momentum = {
        ...momentum,
        ...derived,
        current: Math.min(momentum.current, derived.max),
        hasOverride: false,
      };
    }

    const updated = this.characterDraft.updateDebilitiesAndMomentum(debilities, momentum);
    this.debilityMessage = updated
      ? `${option.label} ${marked ? 'cleared' : 'marked'}. Momentum ${momentum.hasOverride ? 'override preserved' : 'derived values updated'}.`
      : 'No active character is available to update.';
  }

  protected returnMomentumToDerived(): void {
    const character = this.savedCharacter();
    if (!character) return;

    const derived = deriveMomentumValuesFromDebilities(character.debilities);
    const momentum = {
      ...character.momentum,
      ...derived,
      hasOverride: false,
      current: Math.min(character.momentum.current, derived.max),
    };
    this.characterDraft.updateMomentum(momentum);
    this.momentumOverride = false;
    this.momentumMessage = 'Momentum returned to standard derived values.';
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

  protected saveEquipmentNotes(source: Event | HTMLTextAreaElement): void {
    const input =
      source instanceof HTMLTextAreaElement ? source : (source.target as HTMLTextAreaElement);
    const updated = this.characterDraft.updateEquipmentNotes(input.value);
    this.equipmentNotesMessage = updated
      ? 'Equipment notes saved locally.'
      : 'No active character is available to update.';
  }

  protected saveCharacterNotes(source: Event | HTMLTextAreaElement): void {
    const input =
      source instanceof HTMLTextAreaElement ? source : (source.target as HTMLTextAreaElement);
    const updated = this.characterDraft.updateNotes(input.value);
    this.characterNotesMessage = updated
      ? 'Character notes saved locally.'
      : 'No active character is available to update.';
  }

  protected beginAddAsset(): void {
    if (this.hasUnsavedAssetChanges() && !confirm('Discard unsaved asset changes?')) return;

    this.editingAssetId = null;
    this.assetForm.reset({ name: '', category: '', source: '', notes: '' });
    this.assetMessage = '';
    queueMicrotask(() => this.assetNameInput()?.nativeElement.focus());
  }

  protected beginEditAsset(asset: AssetReference): void {
    if (this.hasUnsavedAssetChanges() && !confirm('Discard unsaved asset changes?')) return;

    this.editingAssetId = asset.id;
    this.assetForm.reset({
      name: asset.name,
      category: asset.category ?? '',
      source: asset.source ?? '',
      notes: asset.notes ?? '',
    });
    this.assetMessage = '';
    queueMicrotask(() => this.assetNameInput()?.nativeElement.focus());
  }

  protected saveAsset(): void {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      return;
    }

    const formValue = this.assetForm.getRawValue();
    const input = {
      name: formValue.name.trim(),
      category: formValue.category.trim() || undefined,
      source: formValue.source.trim() || undefined,
      notes: formValue.notes.trim() || undefined,
    };

    const current = this.savedCharacter()?.assets.find((asset) => asset.id === this.editingAssetId);
    const updated = this.editingAssetId
      ? this.characterDraft.updateAssetReference({
          id: this.editingAssetId,
          contentId: current?.contentId,
          provenance: current?.provenance ?? 'user_authored',
          ...input,
        })
      : this.characterDraft.addAssetReference(input);

    if (updated) {
      const returnId = this.editingAssetId;
      this.editingAssetId = null;
      this.assetForm.reset({ name: '', category: '', source: '', notes: '' });
      this.assetForm.markAsPristine();
      this.assetMessage = 'Asset reference saved.';
      queueMicrotask(() => this.focusAssetAction(returnId));
    }
  }

  protected cancelAssetEdit(): void {
    if (this.hasUnsavedAssetChanges() && !confirm('Discard unsaved asset changes?')) return;

    const returnId = this.editingAssetId;
    this.editingAssetId = null;
    this.assetForm.reset({ name: '', category: '', source: '', notes: '' });
    this.assetForm.markAsPristine();
    this.assetMessage = '';
    queueMicrotask(() => this.focusAssetAction(returnId));
  }

  protected confirmRemoveAsset(asset: AssetReference): void {
    if (asset.notes && !confirm(`Remove ${asset.name} and discard its notes?`)) {
      this.focusAssetAction(asset.id);
      return;
    }

    if (!asset.notes && !confirm(`Remove ${asset.name}?`)) {
      this.focusAssetAction(asset.id);
      return;
    }

    const updated = this.characterDraft.removeAssetReference(asset.id);
    if (updated) {
      if (this.editingAssetId === asset.id) {
        this.editingAssetId = null;
        this.assetForm.reset({ name: '', category: '', source: '', notes: '' });
      }
      this.assetMessage = 'Asset reference removed.';
      queueMicrotask(() => this.addAssetButton()?.nativeElement.focus());
    }
  }

  protected showAssetError(controlName: keyof typeof this.assetForm.controls): boolean {
    const control = this.assetForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private hasUnsavedAssetChanges(): boolean {
    return this.assetForm.dirty;
  }

  private focusAssetAction(assetId: string | null): void {
    if (!assetId) {
      this.addAssetButton()?.nativeElement.focus();
      return;
    }

    document.querySelector<HTMLButtonElement>(`[data-asset-edit="${assetId}"]`)?.focus();
  }

  protected beginAddBond(): void {
    if (this.hasUnsavedBondChanges() && !confirm('Discard unsaved bond changes?')) return;

    this.editingBondId = null;
    this.bondForm.reset({ name: '', description: '' });
    this.bondMessage = '';
    queueMicrotask(() => this.bondNameInput()?.nativeElement.focus());
  }

  protected beginEditBond(bond: Bond): void {
    if (this.hasUnsavedBondChanges() && !confirm('Discard unsaved bond changes?')) return;

    this.editingBondId = bond.id;
    this.bondForm.reset({ name: bond.name, description: bond.description ?? '' });
    this.bondMessage = '';
    queueMicrotask(() => this.bondNameInput()?.nativeElement.focus());
  }

  protected saveBond(): void {
    if (this.bondForm.invalid) {
      this.bondForm.markAllAsTouched();
      return;
    }

    const formValue = this.bondForm.getRawValue();
    const input = {
      name: formValue.name.trim(),
      description: formValue.description.trim() || undefined,
    };

    const updated = this.editingBondId
      ? this.characterDraft.updateBond({ id: this.editingBondId, ...input })
      : this.characterDraft.addBond(input);

    if (updated) {
      const returnId = this.editingBondId;
      this.editingBondId = null;
      this.bondForm.reset({ name: '', description: '' });
      this.bondForm.markAsPristine();
      this.bondMessage = 'Bond saved.';
      queueMicrotask(() => this.focusBondAction(returnId));
    }
  }

  protected cancelBondEdit(): void {
    if (this.hasUnsavedBondChanges() && !confirm('Discard unsaved bond changes?')) return;

    const returnId = this.editingBondId;
    this.editingBondId = null;
    this.bondForm.reset({ name: '', description: '' });
    this.bondForm.markAsPristine();
    this.bondMessage = '';
    queueMicrotask(() => this.focusBondAction(returnId));
  }

  protected confirmRemoveBond(bond: Bond): void {
    const warning = bond.description
      ? `Remove ${bond.name} and discard its notes?`
      : `Remove ${bond.name}?`;

    if (!confirm(warning)) {
      this.focusBondAction(bond.id);
      return;
    }

    const updated = this.characterDraft.removeBond(bond.id);
    if (updated) {
      if (this.editingBondId === bond.id) {
        this.editingBondId = null;
        this.bondForm.reset({ name: '', description: '' });
      }
      this.bondMessage = 'Bond removed.';
      queueMicrotask(() => this.addBondButton()?.nativeElement.focus());
    }
  }

  protected showBondError(controlName: keyof typeof this.bondForm.controls): boolean {
    const control = this.bondForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private hasUnsavedBondChanges(): boolean {
    return this.bondForm.dirty;
  }

  private focusBondAction(bondId: string | null): void {
    if (!bondId) {
      this.addBondButton()?.nativeElement.focus();
      return;
    }

    document.querySelector<HTMLButtonElement>(`[data-bond-edit="${bondId}"]`)?.focus();
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
