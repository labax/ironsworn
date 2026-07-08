import { describe, expect, it } from 'vitest';
import { canBurnMomentum, previewMomentumBurn } from './momentum';

describe('momentum burn preview', () => {
  it('identifies challenge dice lower than current momentum', () => {
    const result = previewMomentumBurn({ momentum: 6, challengeDice: [5, 8] });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.canBurn).toBe(true);
    expect(result.value.canceledChallengeDice).toEqual([true, false]);
    expect(result.value.previewOutcome).toBe('weak_hit');
  });

  it('does not cancel challenge dice equal to momentum', () => {
    const result = previewMomentumBurn({ momentum: 6, challengeDice: [6, 4] });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.canceledChallengeDice).toEqual([false, true]);
  });

  it('requires positive momentum for burn eligibility', () => {
    expect(canBurnMomentum(0)).toBe(false);
    expect(canBurnMomentum({ current: 1 })).toBe(true);
  });
});
