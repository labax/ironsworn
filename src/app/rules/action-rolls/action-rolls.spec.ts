import { describe, expect, it } from 'vitest';
import { classifyActionRoll, detectChallengeMatch, resolveActionRoll } from './action-rolls';

describe('action rolls', () => {
  it.each([
    { score: 8, dice: [3, 7] as const, outcome: 'strong_hit' },
    { score: 6, dice: [3, 7] as const, outcome: 'weak_hit' },
    { score: 2, dice: [3, 7] as const, outcome: 'miss' },
    { score: 7, dice: [7, 8] as const, outcome: 'miss' },
    { score: 7, dice: [6, 7] as const, outcome: 'weak_hit' },
  ])('classifies $outcome for score $score against $dice', ({ score, dice, outcome }) => {
    expect(classifyActionRoll(score, dice)).toBe(outcome);
  });

  it('detects challenge matches', () => {
    expect(detectChallengeMatch([4, 4])).toBe(true);
    expect(detectChallengeMatch([4, 5])).toBe(false);
  });

  it('resolves typed action roll input with capped score and trace', () => {
    const result = resolveActionRoll({ actionDie: 6, challengeDice: [9, 10], stat: 3, adds: 4 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rawScore).toBe(13);
    expect(result.value.cappedScore).toBe(10);
    expect(result.value.outcome).toBe('weak_hit');
    expect(result.value.isMatch).toBe(false);
    expect(result.value.trace.length).toBeGreaterThan(0);
  });

  it('returns validation errors for invalid normal inputs', () => {
    const result = resolveActionRoll({ actionDie: 7, challengeDice: [0, 11], stat: 1 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(3);
  });
});
