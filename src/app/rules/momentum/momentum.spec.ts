import { describe, expect, it } from 'vitest';
import {
  canBurnMomentum,
  deriveMomentumValuesFromDebilityCount,
  previewMomentumBurn,
} from './momentum';

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

describe('Momentum values derived from debilities', () => {
  it('uses maximum 10 and reset 2 when no debilities are marked', () => {
    expect(deriveMomentumValuesFromDebilityCount(0)).toEqual({ max: 10, reset: 2 });
  });

  it('reduces maximum and reset for one marked debility', () => {
    expect(deriveMomentumValuesFromDebilityCount(1)).toEqual({ max: 9, reset: 1 });
  });

  it('reduces maximum by every marked debility and uses reset 0 for multiples', () => {
    expect(deriveMomentumValuesFromDebilityCount(3)).toEqual({ max: 7, reset: 0 });
  });

  it('normalizes invalid counts deterministically', () => {
    expect(deriveMomentumValuesFromDebilityCount(-2)).toEqual({ max: 10, reset: 2 });
    expect(deriveMomentumValuesFromDebilityCount(1.9)).toEqual({ max: 9, reset: 1 });
  });
});
