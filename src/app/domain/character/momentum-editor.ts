import type { MomentumState } from './character';

export const MOMENTUM_MINIMUM = -6;
export const DEFAULT_MOMENTUM_RESET = 2;
export const DEFAULT_MOMENTUM_MAXIMUM = 10;

export interface MomentumValidationResult {
  readonly valid: boolean;
  readonly message?: string;
}

export const isWholeMomentumValue = (value: number): boolean => Number.isInteger(value);

export const validateMomentumState = (
  momentum: MomentumState,
  options: { readonly allowOverride: boolean } = { allowOverride: momentum.hasOverride },
): MomentumValidationResult => {
  if (![momentum.current, momentum.reset, momentum.max].every(isWholeMomentumValue)) {
    return { valid: false, message: 'Use whole numbers for Momentum.' };
  }

  if (momentum.max < momentum.reset && !options.allowOverride) {
    return { valid: false, message: 'Maximum Momentum must be at least the reset value.' };
  }

  if (momentum.current < MOMENTUM_MINIMUM && !options.allowOverride) {
    return { valid: false, message: 'Momentum cannot be below -6 without override.' };
  }

  if (momentum.current > momentum.max && !options.allowOverride) {
    return { valid: false, message: 'Momentum cannot exceed maximum without override.' };
  }

  return { valid: true };
};

export const buildMomentumPatch = (
  current: MomentumState,
  patch: Partial<MomentumState>,
): MomentumState => ({
  ...current,
  ...patch,
  hasOverride: patch.hasOverride ?? current.hasOverride,
});
