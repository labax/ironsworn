import {
  Component,
  ElementRef,
  InjectionToken,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActiveCharacterService, type StatKey } from '@app/domain/character';
import {
  MomentumBurnApplicationService,
  RollHistoryService,
  type PreparedActionRollInput,
} from '@app/domain/rolls';
import {
  previewActionRollMomentumBurn,
  resolveActionRoll,
  type ActionRollInput as RulesActionRollInput,
  type ActionRollResult,
  type MomentumBurnPreviewResult,
} from '@app/rules';
import type { RulesResult } from '@app/rules';

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

export type ActionRollResolver = (input: RulesActionRollInput) => RulesResult<ActionRollResult>;

export const ACTION_ROLL_RESOLVER = new InjectionToken<ActionRollResolver>('ACTION_ROLL_RESOLVER', {
  providedIn: 'root',
  factory: () => resolveActionRoll,
});

@Component({
  selector: 'app-action-roll-input',
  imports: [ReactiveFormsModule],
  templateUrl: './action-roll-input.html',
  styleUrl: './action-roll-input.css',
})
export class ActionRollInput {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly activeCharacter = inject(ActiveCharacterService);
  private readonly actionRollResolver = inject(ACTION_ROLL_RESOLVER);
  private readonly rollHistory = inject(RollHistoryService);
  private readonly momentumBurnApplication = inject(MomentumBurnApplicationService);

  @ViewChild('momentumConfirmation') private momentumConfirmation?: ElementRef<HTMLElement>;
  private previewTrigger: HTMLElement | null = null;

  readonly prepared = output<PreparedActionRollInput>();

  protected readonly statOptions = STAT_OPTIONS;
  protected readonly characterSummary = this.activeCharacter.activeCharacterSummary;
  protected readonly hasCharacter = this.activeCharacter.hasActiveCharacter;
  protected readonly lastPreparedInput = signal<PreparedActionRollInput | null>(null);
  protected readonly lastResolvedRoll = signal<ActionRollResult | null>(null);
  protected readonly momentumBurnPreview = signal<MomentumBurnPreviewResult | null>(null);
  protected readonly isMomentumPreviewOpen = signal(false);
  protected readonly isApplyingMomentumBurn = signal(false);
  protected readonly momentumBurnError = signal<string | null>(null);
  protected readonly lastHistoryEntryId = signal<string | null>(null);
  protected readonly rollError = signal<string | null>(null);
  protected readonly isResolving = signal(false);
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
    if (this.isResolving()) return;

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
    this.rollError.set(null);
    this.isResolving.set(true);
    try {
      const resolved = this.actionRollResolver({
        stat: prepared.statValue,
        adds: prepared.adds,
      });

      if (resolved.ok) {
        this.lastResolvedRoll.set(resolved.value);
        this.recomputeMomentumBurnPreview(resolved.value);
        const history = this.rollHistory.saveActionRoll({ prepared, result: resolved.value });
        this.lastHistoryEntryId.set(history.id);
      } else {
        this.lastResolvedRoll.set(null);
        this.momentumBurnPreview.set(null);
        this.isMomentumPreviewOpen.set(false);
        this.rollError.set('The roll could not be resolved. Check the input and try again.');
      }
    } catch {
      this.lastResolvedRoll.set(null);
      this.momentumBurnPreview.set(null);
      this.isMomentumPreviewOpen.set(false);
      this.rollError.set('The roll could not be resolved. Check the input and try again.');
    } finally {
      this.isResolving.set(false);
    }
    this.prepared.emit(prepared);
  }

  protected showMomentumPreview(): void {
    this.previewTrigger =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const roll = this.lastResolvedRoll();
    if (roll) {
      this.recomputeMomentumBurnPreview(roll);
    }
    this.momentumBurnError.set(null);
    this.isMomentumPreviewOpen.set(true);
    queueMicrotask(() => this.momentumConfirmation?.nativeElement.focus());
  }

  protected dismissMomentumPreview(): void {
    this.isMomentumPreviewOpen.set(false);
    this.momentumBurnError.set(null);
    queueMicrotask(() => this.previewTrigger?.focus());
  }

  protected async confirmMomentumBurn(): Promise<void> {
    if (this.isApplyingMomentumBurn()) return;
    const roll = this.lastResolvedRoll();
    const preview = this.momentumBurnPreview();
    const prepared = this.lastPreparedInput();
    if (!roll || !preview || !prepared) return;

    this.isApplyingMomentumBurn.set(true);
    this.momentumBurnError.set(null);
    const result = await this.momentumBurnApplication.apply({
      roll,
      preview,
      prepared,
      historyEntryId: this.lastHistoryEntryId() ?? undefined,
    });
    this.isApplyingMomentumBurn.set(false);

    if (result.success) {
      this.lastResolvedRoll.set(result.roll);
      this.lastHistoryEntryId.set(result.history.id);
      this.momentumBurnPreview.set(null);
      this.isMomentumPreviewOpen.set(false);
      queueMicrotask(() => this.previewTrigger?.focus());
      return;
    }

    this.momentumBurnError.set(result.reason);
    this.recomputeMomentumBurnPreview(roll);
  }

  protected resultLabel(result: ActionRollResult['outcome']): string {
    switch (result) {
      case 'strong_hit':
        return 'Strong hit';
      case 'weak_hit':
        return 'Weak hit';
      case 'miss':
        return 'Miss';
    }
  }

  protected showError(controlName: keyof typeof this.rollForm.controls): boolean {
    const control = this.rollForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private recomputeMomentumBurnPreview(roll: ActionRollResult): void {
    const character = this.activeCharacter.activeCharacter();
    if (!character) {
      this.momentumBurnPreview.set(null);
      this.isMomentumPreviewOpen.set(false);
      return;
    }

    const preview = previewActionRollMomentumBurn(roll, character.momentum);
    this.momentumBurnPreview.set(preview.ok ? preview.value : null);
    if (!preview.ok || !preview.value.eligible) {
      this.isMomentumPreviewOpen.set(false);
    }
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
