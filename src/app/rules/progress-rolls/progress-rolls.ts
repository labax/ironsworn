import type { ProgressRollDice, RollOutcome } from '@domain/rolls';
import { rollChallengeDice, validateChallengeDie } from '../dice';
import { detectChallengeMatch } from '../action-rolls';
import { rulesFailure, rulesSuccess, type RulesResult, type ValidationError } from '../validation';

export type ProgressRollOutcome = Extract<RollOutcome, 'strong_hit' | 'weak_hit' | 'miss'>;

export interface ProgressRollInput {
  readonly progressScore: number;
  readonly challengeDice?: readonly [number, number];
}

export interface ProgressRollResult extends ProgressRollDice {
  readonly outcome: ProgressRollOutcome;
  readonly challengeResults: readonly [boolean, boolean];
  readonly isMatch: boolean;
  readonly trace: readonly string[];
}

export const classifyProgressRoll = (
  progressScore: number,
  challengeDice: readonly [number, number],
): ProgressRollOutcome => {
  const hits = challengeDice.filter((challengeDie) => progressScore > challengeDie).length;
  if (hits === 2) return 'strong_hit';
  if (hits === 1) return 'weak_hit';
  return 'miss';
};

export const resolveProgressRoll = (input: ProgressRollInput): RulesResult<ProgressRollResult> => {
  const challengeDice = input.challengeDice ?? rollChallengeDice();
  const errors: ValidationError[] = challengeDice.flatMap((die, index) => {
    const result = validateChallengeDie(die, `challengeDice.${index}`);
    return result.ok ? [] : result.errors;
  });

  if (
    !Number.isInteger(input.progressScore) ||
    input.progressScore < 0 ||
    input.progressScore > 10
  ) {
    errors.push({
      code: 'out_of_range',
      field: 'progressScore',
      message: 'progressScore must be an integer from 0 to 10.',
    });
  }
  if (errors.length > 0) return rulesFailure(errors);

  const outcome = classifyProgressRoll(input.progressScore, challengeDice);
  return rulesSuccess({
    progressScore: input.progressScore,
    challengeDice,
    outcome,
    challengeResults: [
      input.progressScore > challengeDice[0],
      input.progressScore > challengeDice[1],
    ],
    isMatch: detectChallengeMatch(challengeDice),
    trace: ['progress score compares directly to challenge dice'],
  });
};
