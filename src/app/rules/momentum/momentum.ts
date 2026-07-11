import type { MomentumState } from '@domain/character';
import type { RollType } from '@domain/rolls';
import type { ActionRollOutcome, ActionRollResult } from '../action-rolls';
import { validateChallengeDie } from '../dice';
import { rulesFailure, rulesSuccess, type RulesResult, type ValidationError } from '../validation';

export type ChallengeDiePosition = 0 | 1;

export interface CancelableChallengeDie {
  readonly position: ChallengeDiePosition;
  readonly value: number;
}

export interface MomentumBurnPreviewInput {
  readonly rollType?: RollType;
  readonly momentum: Pick<MomentumState, 'current' | 'reset'> | number | null | undefined;
  readonly actionScore?: number;
  readonly challengeDice?: readonly [number, number];
  readonly initialOutcome?: ActionRollOutcome;
  readonly isMatch?: boolean;
}

export interface MomentumBurnPreviewResult {
  readonly eligible: boolean;
  readonly canBurn: boolean;
  readonly momentum: number | null;
  readonly reset?: number;
  readonly actionScore?: number;
  readonly challengeDice: readonly [number, number] | null;
  readonly initialOutcome?: ActionRollOutcome;
  readonly prospectiveOutcome?: ActionRollOutcome;
  readonly isMatch?: boolean;
  readonly cancelableDice: readonly CancelableChallengeDie[];
  readonly canceledDice: readonly CancelableChallengeDie[];
  readonly canceledChallengeDice: readonly [boolean, boolean];
  readonly ineligibilityReason?:
    | 'non_action_roll'
    | 'missing_roll'
    | 'missing_momentum'
    | 'non_positive_momentum'
    | 'no_lower_challenge_die';
  readonly trace: readonly string[];
}

const momentumValue = (
  momentum: Pick<MomentumState, 'current'> | number | null | undefined,
): number | null => {
  if (momentum === null || momentum === undefined) return null;
  return typeof momentum === 'number' ? momentum : momentum.current;
};

const momentumReset = (
  momentum: Pick<MomentumState, 'reset'> | number | null | undefined,
): number | undefined =>
  typeof momentum === 'object' && momentum !== null ? momentum.reset : undefined;

export const canBurnMomentum = (
  momentum: Pick<MomentumState, 'current'> | number | null | undefined,
): boolean => {
  const value = momentumValue(momentum);
  return value !== null && Number.isInteger(value) && value > 0;
};

const classifyWithCanceledDice = (
  actionScore: number,
  challengeDice: readonly [number, number],
  canceledChallengeDice: readonly [boolean, boolean],
): ActionRollOutcome => {
  const hits = challengeDice.filter(
    (challengeDie, index) => canceledChallengeDice[index] || actionScore > challengeDie,
  ).length;
  if (hits === 2) return 'strong_hit';
  if (hits === 1) return 'weak_hit';
  return 'miss';
};

export const previewMomentumBurn = (
  input: MomentumBurnPreviewInput,
): RulesResult<MomentumBurnPreviewResult> => {
  const momentum = momentumValue(input.momentum);
  const reset = momentumReset(input.momentum);
  const rollType = input.rollType ?? 'action';
  const trace = ['evaluate action-roll burn eligibility without mutating roll or character state'];

  if (rollType !== 'action') {
    return rulesSuccess({
      eligible: false,
      canBurn: false,
      momentum,
      reset,
      challengeDice: input.challengeDice ?? null,
      initialOutcome: input.initialOutcome,
      isMatch: input.isMatch,
      cancelableDice: [],
      canceledDice: [],
      canceledChallengeDice: [false, false],
      ineligibilityReason: 'non_action_roll',
      trace,
    });
  }

  if (!input.challengeDice || input.actionScore === undefined || !input.initialOutcome) {
    return rulesSuccess({
      eligible: false,
      canBurn: false,
      momentum,
      reset,
      challengeDice: input.challengeDice ?? null,
      initialOutcome: input.initialOutcome,
      actionScore: input.actionScore,
      isMatch: input.isMatch,
      cancelableDice: [],
      canceledDice: [],
      canceledChallengeDice: [false, false],
      ineligibilityReason: 'missing_roll',
      trace,
    });
  }

  const errors: ValidationError[] = input.challengeDice.flatMap((die, index) => {
    const result = validateChallengeDie(die, `challengeDice.${index}`);
    return result.ok ? [] : result.errors;
  });
  if (!Number.isInteger(momentum)) {
    errors.push({
      code: 'not_integer',
      field: 'momentum',
      message: 'momentum must be an integer.',
    });
  }
  if (!Number.isInteger(input.actionScore)) {
    errors.push({
      code: 'not_integer',
      field: 'actionScore',
      message: 'actionScore must be an integer.',
    });
  }
  if (errors.length > 0) return rulesFailure(errors);

  const cancelableDice = input.challengeDice.flatMap((value, index) =>
    momentum !== null && momentum > 0 && value < momentum
      ? [{ position: index as ChallengeDiePosition, value }]
      : [],
  );
  const canceledChallengeDice = input.challengeDice.map(
    (die) => momentum !== null && momentum > 0 && die < momentum,
  ) as [boolean, boolean];
  const eligible = cancelableDice.length > 0;
  const prospectiveOutcome = eligible
    ? classifyWithCanceledDice(input.actionScore, input.challengeDice, canceledChallengeDice)
    : input.initialOutcome;

  return rulesSuccess({
    eligible,
    canBurn: eligible,
    momentum,
    reset,
    actionScore: input.actionScore,
    challengeDice: [...input.challengeDice] as [number, number],
    initialOutcome: input.initialOutcome,
    prospectiveOutcome,
    isMatch: input.isMatch,
    cancelableDice,
    canceledDice: cancelableDice,
    canceledChallengeDice,
    ineligibilityReason: eligible
      ? undefined
      : momentum === null
        ? 'missing_momentum'
        : momentum <= 0
          ? 'non_positive_momentum'
          : 'no_lower_challenge_die',
    trace: [...trace, 'challenge dice equal to momentum are not canceled'],
  });
};

export const previewActionRollMomentumBurn = (
  roll: ActionRollResult,
  momentum: Pick<MomentumState, 'current' | 'reset'> | number | null | undefined,
): RulesResult<MomentumBurnPreviewResult> =>
  previewMomentumBurn({
    rollType: 'action',
    momentum,
    actionScore: roll.cappedScore,
    challengeDice: roll.challengeDice,
    initialOutcome: roll.outcome,
    isMatch: roll.isMatch,
  });

export const STANDARD_MOMENTUM_RESET = 2;
export const STANDARD_MOMENTUM_MAXIMUM = 10;

export interface DerivedMomentumValues {
  readonly max: number;
  readonly reset: number;
}

export const deriveMomentumValuesFromDebilityCount = (
  debilityCount: number,
): DerivedMomentumValues => {
  const markedDebilities = Math.max(0, Math.trunc(debilityCount));

  return {
    max: STANDARD_MOMENTUM_MAXIMUM - markedDebilities,
    reset: markedDebilities === 0 ? STANDARD_MOMENTUM_RESET : markedDebilities === 1 ? 1 : 0,
  };
};

export const deriveMomentumValuesFromDebilities = (
  debilities: readonly unknown[],
): DerivedMomentumValues => deriveMomentumValuesFromDebilityCount(debilities.length);
