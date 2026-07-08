import { describe, expect, it } from 'vitest';
import { resolveOracleRoll } from './oracles';

describe('oracle rolls', () => {
  it('resolves typed oracle input with project-original placeholder ranges', () => {
    const result = resolveOracleRoll({
      roll: 42,
      ranges: [{ min: 1, max: 50, label: 'placeholder low range' }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.roll).toBe(42);
    expect(result.value.matchedRange?.label).toBe('placeholder low range');
  });
});
