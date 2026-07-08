import type { ActionRollDice, RollOutcome } from '@domain/rolls';
import { rollActionDie, rollChallengeDice, validateActionDie, validateChallengeDie } from '../dice';
import { rulesFailure, rulesSuccess, type RulesResult, type ValidationError } from '../validation';

export type ActionRollOutcome = Extract<RollOutcome, 'strong_hit' | 'weak_hit' | 'miss'>;

export interface ActionRollInput {
  readonly actionDie?: number;
  readonly challengeDice?: readonly [number, number];
  readonly stat: number;
  readonly adds?: number;
  readonly momentum?: number;
}

export interface ActionRollResult extends ActionRollDice {
  readonly adds: number;
  readonly rawScore: number;
  readonly cappedScore: number;
  readonly outcome: ActionRollOutcome;
  readonly challengeResults: readonly [boolean, boolean];
  readonly isMatch: boolean;
  readonly trace: readonly string[];
}

export const ACTION_SCORE_CAP = 10;

export const detectChallengeMatch = (challengeDice: readonly [number, number]): boolean =>
  challengeDice[0] === challengeDice[1];

export const classifyActionRoll = (
  actionScore: number,
  challengeDice: readonly [number, number],
): ActionRollOutcome => {
  const hits = challengeDice.filter((challengeDie) => actionScore > challengeDie).length;
  if (hits === 2) return 'strong_hit';
  if (hits === 1) return 'weak_hit';
  return 'miss';
};

const collectChallengeDiceErrors = (challengeDice: readonly [number, number]): ValidationError[] =>
  challengeDice.flatMap((die, index) => {
    const validation = validateChallengeDie(die, `challengeDice.${index}`);
    return validation.ok ? [] : validation.errors;
  });

export const resolveActionRoll = (input: ActionRollInput): RulesResult<ActionRollResult> => {
  const actionDie = input.actionDie ?? rollActionDie();
  const challengeDice = input.challengeDice ?? rollChallengeDice();
  const actionDieValidation = validateActionDie(actionDie);
  const challengeErrors = collectChallengeDiceErrors(challengeDice);
  const numericErrors: ValidationError[] = [];

  if (!Number.isInteger(input.stat)) {
    numericErrors.push({ code: 'not_integer', field: 'stat', message: 'stat must be an integer.' });
  }
  if (input.adds !== undefined && !Number.isInteger(input.adds)) {
    numericErrors.push({ code: 'not_integer', field: 'adds', message: 'adds must be an integer.' });
  }

  if (!actionDieValidation.ok || challengeErrors.length > 0 || numericErrors.length > 0) {
    return rulesFailure([
      ...(actionDieValidation.ok ? [] : actionDieValidation.errors),
      ...challengeErrors,
      ...numericErrors,
    ]);
  }

  const adds = input.adds ?? 0;
  const rawScore = actionDie + input.stat + adds;
  const cappedScore = Math.min(ACTION_SCORE_CAP, rawScore);
  const outcome = classifyActionRoll(cappedScore, challengeDice);

  return rulesSuccess({
    actionDie,
    challengeDice,
    statBonus: input.stat,
    adds,
    rawScore,
    cappedScore,
    outcome,
    challengeResults: [cappedScore > challengeDice[0], cappedScore > challengeDice[1]],
    isMatch: detectChallengeMatch(challengeDice),
    trace: ['action_die + stat + adds', 'cap action score before comparison'],
  });
};
