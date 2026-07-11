import { Injectable, inject } from '@angular/core';

import {
  ActiveCharacterPersistenceService,
  ActiveCharacterService,
  type Character,
} from '@app/domain/character';
import {
  previewActionRollMomentumBurn,
  type ActionRollResult,
  type MomentumBurnPreviewResult,
} from '@app/rules';
import type { SaveResult } from '@app/core/storage';
import type { PreparedActionRollInput, RollHistoryEntry } from './index';
import { RollHistoryService } from './roll-history.service';

export type MomentumBurnApplicationResult =
  | { readonly success: true; readonly roll: ActionRollResult; readonly history: RollHistoryEntry }
  | { readonly success: false; readonly reason: string; readonly saveResult?: SaveResult };

export interface ApplyMomentumBurnInput {
  readonly roll: ActionRollResult;
  readonly preview: MomentumBurnPreviewResult;
  readonly prepared: PreparedActionRollInput;
  readonly historyEntryId?: string;
}

const sameDice = (
  left: readonly [number, number],
  right: readonly [number, number] | null,
): boolean => !!right && left[0] === right[0] && left[1] === right[1];

const cloneCharacterWithMomentumReset = (character: Character, reset: number): Character => ({
  ...character,
  stats: { ...character.stats },
  statusTracks: { ...character.statusTracks },
  momentum: { ...character.momentum, current: reset },
  debilities: [...character.debilities],
  bonds: [...character.bonds],
  assets: [...character.assets],
  experience: { ...character.experience },
  updatedAt: new Date().toISOString(),
});

@Injectable({ providedIn: 'root' })
export class MomentumBurnApplicationService {
  private readonly activeCharacter = inject(ActiveCharacterService);
  private readonly persistence = inject(ActiveCharacterPersistenceService);
  private readonly rollHistory = inject(RollHistoryService);
  private readonly finalizedRolls = new WeakSet<ActionRollResult>();

  async apply(input: ApplyMomentumBurnInput): Promise<MomentumBurnApplicationResult> {
    if (this.finalizedRolls.has(input.roll)) {
      const history = input.historyEntryId
        ? this.rollHistory.entries().find((entry) => entry.id === input.historyEntryId)
        : undefined;
      return history
        ? { success: true, roll: input.roll, history }
        : { success: false, reason: 'This roll already burned Momentum.' };
    }

    const character = this.activeCharacter.activeCharacter();
    if (!character) return { success: false, reason: 'No active character is available.' };
    if (
      !input.preview.eligible ||
      !input.preview.prospectiveOutcome ||
      input.preview.reset === undefined
    ) {
      return { success: false, reason: 'This roll is not eligible to burn Momentum.' };
    }
    if (
      character.momentum.current !== input.preview.momentum ||
      character.momentum.reset !== input.preview.reset ||
      input.roll.outcome !== input.preview.initialOutcome ||
      input.roll.isMatch !== input.preview.isMatch ||
      input.roll.cappedScore !== input.preview.actionScore ||
      !sameDice(input.roll.challengeDice, input.preview.challengeDice)
    ) {
      return {
        success: false,
        reason: 'Momentum or roll state changed. Roll again before burning.',
      };
    }

    const revalidated = previewActionRollMomentumBurn(input.roll, character.momentum);
    if (
      !revalidated.ok ||
      !revalidated.value.eligible ||
      revalidated.value.prospectiveOutcome !== input.preview.prospectiveOutcome ||
      revalidated.value.canceledDice.length !== input.preview.canceledDice.length
    ) {
      return { success: false, reason: 'Momentum burn eligibility changed.' };
    }

    const updatedCharacter = cloneCharacterWithMomentumReset(character, input.preview.reset);
    const saveResult = await this.persistence.saveActiveCharacter(updatedCharacter);
    if (!saveResult.success) {
      return { success: false, reason: 'Momentum reset could not be saved.', saveResult };
    }

    const finalizedRoll: ActionRollResult = {
      ...input.roll,
      outcome: input.preview.prospectiveOutcome,
      challengeResults: [
        input.preview.canceledChallengeDice[0] || input.roll.challengeResults[0],
        input.preview.canceledChallengeDice[1] || input.roll.challengeResults[1],
      ],
      trace: [...input.roll.trace, 'momentum burn applied from confirmed preview'],
    };
    const history = this.rollHistory.finalizeActionRollMomentumBurn({
      id: input.historyEntryId,
      prepared: input.prepared,
      result: input.roll,
      finalOutcome: input.preview.prospectiveOutcome,
      momentumBurn: {
        applied: true,
        canceledDice: input.preview.canceledDice,
        momentumUsed: input.preview.momentum!,
        resetValue: input.preview.reset,
        initialOutcome: input.preview.initialOutcome!,
        finalOutcome: input.preview.prospectiveOutcome,
        originalMatch: input.preview.isMatch ?? false,
      },
    });
    this.activeCharacter.setActiveCharacter(updatedCharacter);
    this.finalizedRolls.add(input.roll);
    this.finalizedRolls.add(finalizedRoll);
    return { success: true, roll: finalizedRoll, history };
  }
}
