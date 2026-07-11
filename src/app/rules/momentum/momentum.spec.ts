import { describe, expect, it } from 'vitest';
import {
  canBurnMomentum,
  deriveMomentumValuesFromDebilityCount,
  previewMomentumBurn,
} from './momentum';

const actionPreview = (overrides: Partial<Parameters<typeof previewMomentumBurn>[0]> = {}) =>
  previewMomentumBurn({
    rollType: 'action',
    momentum: { current: 6, reset: 2 },
    actionScore: 4,
    challengeDice: [5, 8],
    initialOutcome: 'miss',
    isMatch: false,
    ...overrides,
  });

describe('momentum burn preview', () => {
  it('identifies stable challenge die positions and values lower than positive momentum', () => {
    const result = actionPreview();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.eligible).toBe(true);
    expect(result.value.cancelableDice).toEqual([{ position: 0, value: 5 }]);
    expect(result.value.canceledChallengeDice).toEqual([true, false]);
    expect(result.value.momentum).toBe(6);
    expect(result.value.reset).toBe(2);
  });

  it('previews a one-die cancellation result transition from miss to weak hit', () => {
    const result = actionPreview();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.initialOutcome).toBe('miss');
    expect(result.value.prospectiveOutcome).toBe('weak_hit');
  });

  it('previews strong hit when both challenge dice are canceled', () => {
    const result = actionPreview({ momentum: 8, challengeDice: [5, 7] });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.cancelableDice).toEqual([
      { position: 0, value: 5 },
      { position: 1, value: 7 },
    ]);
    expect(result.value.prospectiveOutcome).toBe('strong_hit');
  });

  it('does not cancel challenge dice equal to momentum at the strict boundary', () => {
    const result = actionPreview({ momentum: 6, challengeDice: [6, 8] });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.eligible).toBe(false);
    expect(result.value.cancelableDice).toEqual([]);
    expect(result.value.ineligibilityReason).toBe('no_lower_challenge_die');
  });

  it('requires positive momentum for eligibility', () => {
    expect(canBurnMomentum(0)).toBe(false);
    expect(canBurnMomentum(-1)).toBe(false);
    expect(canBurnMomentum({ current: 1 })).toBe(true);

    const zero = actionPreview({ momentum: 0 });
    const negative = actionPreview({ momentum: -2 });
    expect(zero.ok && zero.value.eligible).toBe(false);
    expect(negative.ok && negative.value.eligible).toBe(false);
  });

  it('rejects progress and oracle rolls regardless of momentum', () => {
    const progress = actionPreview({ rollType: 'progress', momentum: 8, challengeDice: [1, 2] });
    const oracle = actionPreview({ rollType: 'oracle', momentum: 8, challengeDice: [1, 2] });

    expect(progress.ok && progress.value.ineligibilityReason).toBe('non_action_roll');
    expect(oracle.ok && oracle.value.ineligibilityReason).toBe('non_action_roll');
  });

  it('preserves original match state in the preview', () => {
    const result = actionPreview({ momentum: 8, challengeDice: [5, 5], isMatch: true });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.isMatch).toBe(true);
    expect(result.value.prospectiveOutcome).toBe('strong_hit');
  });

  it('fails safely without usable momentum', () => {
    const missing = actionPreview({ momentum: null });

    expect(missing.ok).toBe(false);
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
