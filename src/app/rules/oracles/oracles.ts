import type { OracleOdds, OracleResultRange } from '@domain/oracles';
import type { OracleRollDice } from '@domain/rolls';
import { rollOracleD100, validateOracleD100 } from '../dice';
import { rulesFailure, rulesSuccess, type RulesResult } from '../validation';

export interface OracleRollInput {
  readonly roll?: number;
  readonly odds?: OracleOdds;
  readonly ranges?: readonly OracleResultRange[];
}

export interface OracleRollResult extends OracleRollDice {
  readonly odds?: OracleOdds;
  readonly matchedRange?: OracleResultRange;
  readonly trace: readonly string[];
}

export const findOracleRange = (
  roll: number,
  ranges: readonly OracleResultRange[] = [],
): OracleResultRange | undefined => ranges.find((range) => roll >= range.min && roll <= range.max);

export const resolveOracleRoll = (input: OracleRollInput = {}): RulesResult<OracleRollResult> => {
  const roll = input.roll ?? rollOracleD100();
  const validation = validateOracleD100(roll);
  if (!validation.ok) return rulesFailure(validation.errors);

  return rulesSuccess({
    roll,
    odds: input.odds,
    matchedRange: findOracleRange(roll, input.ranges),
    trace: ['d100 oracle roll resolved without bundled table text'],
  });
};
