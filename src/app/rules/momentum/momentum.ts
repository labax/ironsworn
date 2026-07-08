import type { MomentumState } from '@domain/character';
import { classifyActionRoll, type ActionRollOutcome } from '../action-rolls';
import { validateChallengeDie } from '../dice';
import { rulesFailure, rulesSuccess, type RulesResult, type ValidationError } from '../validation';

export interface MomentumBurnPreviewInput {
  readonly momentum: Pick<MomentumState, 'current'> | number;
  readonly challengeDice: readonly [number, number];
}

export interface MomentumBurnPreviewResult {
  readonly canBurn: boolean;
  readonly momentum: number;
  readonly canceledChallengeDice: readonly [boolean, boolean];
  readonly previewOutcome: ActionRollOutcome;
  readonly trace: readonly string[];
}

const momentumValue = (momentum: Pick<MomentumState, 'current'> | number): number =>
  typeof momentum === 'number' ? momentum : momentum.current;

export const canBurnMomentum = (momentum: Pick<MomentumState, 'current'> | number): boolean =>
  Number.isInteger(momentumValue(momentum)) && momentumValue(momentum) > 0;

export const previewMomentumBurn = (
  input: MomentumBurnPreviewInput,
): RulesResult<MomentumBurnPreviewResult> => {
  const momentum = momentumValue(input.momentum);
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
  if (errors.length > 0) return rulesFailure(errors);

  const canBurn = canBurnMomentum(momentum);
  const canceledChallengeDice = input.challengeDice.map((die) => canBurn && momentum > die) as [
    boolean,
    boolean,
  ];

  return rulesSuccess({
    canBurn,
    momentum,
    canceledChallengeDice,
    previewOutcome: classifyActionRoll(momentum, input.challengeDice),
    trace: [
      'positive momentum can replace action score for preview',
      'only lower challenge dice are canceled',
    ],
  });
};
