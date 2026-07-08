import { rangeError, rulesFailure, rulesSuccess, type RulesResult } from '../validation';

export interface RandomNumberProvider {
  readonly next: () => number;
}

export interface DiceRoller {
  readonly rollActionDie: () => number;
  readonly rollChallengeDie: () => number;
  readonly rollChallengeDice: () => readonly [number, number];
  readonly rollOracleD100: () => number;
}

export const ACTION_DIE_MIN = 1;
export const ACTION_DIE_MAX = 6;
export const CHALLENGE_DIE_MIN = 1;
export const CHALLENGE_DIE_MAX = 10;
export const ORACLE_D100_MIN = 1;
export const ORACLE_D100_MAX = 100;

export const defaultRandomNumberProvider: RandomNumberProvider = { next: Math.random };

export const rollDie = (
  sides: number,
  provider: RandomNumberProvider = defaultRandomNumberProvider,
): number => Math.floor(provider.next() * sides) + 1;

export const rollActionDie = (provider?: RandomNumberProvider): number =>
  rollDie(ACTION_DIE_MAX, provider);

export const rollChallengeDie = (provider?: RandomNumberProvider): number =>
  rollDie(CHALLENGE_DIE_MAX, provider);

export const rollChallengeDice = (provider?: RandomNumberProvider): readonly [number, number] => [
  rollChallengeDie(provider),
  rollChallengeDie(provider),
];

export const rollOracleD100 = (provider?: RandomNumberProvider): number =>
  rollDie(ORACLE_D100_MAX, provider);

export const createDiceRoller = (
  provider: RandomNumberProvider = defaultRandomNumberProvider,
): DiceRoller => ({
  rollActionDie: () => rollActionDie(provider),
  rollChallengeDie: () => rollChallengeDie(provider),
  rollChallengeDice: () => rollChallengeDice(provider),
  rollOracleD100: () => rollOracleD100(provider),
});

export const validateIntegerRange = (
  field: string,
  value: number,
  min: number,
  max: number,
): RulesResult<number> => {
  if (Number.isInteger(value) && value >= min && value <= max) return rulesSuccess(value);
  return rulesFailure([rangeError(field, min, max, value)]);
};

export const validateActionDie = (value: number): RulesResult<number> =>
  validateIntegerRange('actionDie', value, ACTION_DIE_MIN, ACTION_DIE_MAX);

export const validateChallengeDie = (value: number, field = 'challengeDie'): RulesResult<number> =>
  validateIntegerRange(field, value, CHALLENGE_DIE_MIN, CHALLENGE_DIE_MAX);

export const validateOracleD100 = (value: number): RulesResult<number> =>
  validateIntegerRange('oracleRoll', value, ORACLE_D100_MIN, ORACLE_D100_MAX);
