import { describe, expect, it } from 'vitest';
import { createDiceRoller, rollActionDie, rollChallengeDice, rollOracleD100 } from './dice';
import { createFixedRandomProvider } from '../testing';

describe('dice helpers', () => {
  it('generates dice values inside supported ranges', () => {
    const low = createFixedRandomProvider([0]);
    const high = createFixedRandomProvider([0.999]);

    expect(rollActionDie(low)).toBe(1);
    expect(rollActionDie(high)).toBe(6);
    expect(rollChallengeDice(createFixedRandomProvider([0, 0.999]))).toEqual([1, 10]);
    expect(rollOracleD100(createFixedRandomProvider([0.999]))).toBe(100);
  });

  it('supports deterministic dice roller injection', () => {
    const roller = createDiceRoller(createFixedRandomProvider([0.5, 0.1, 0.9, 0.25]));

    expect(roller.rollActionDie()).toBe(4);
    expect(roller.rollChallengeDice()).toEqual([2, 10]);
    expect(roller.rollOracleD100()).toBe(26);
  });
});
