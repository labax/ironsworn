import { describe, expect, it } from 'vitest';

import {
  validateProgressTrackDetails,
  validateProgressTrackTicks,
} from './progress-track.validation';

describe('progress track validation', () => {
  it('accepts supported details and trims user text', () => {
    expect(
      validateProgressTrackDetails({ title: '  Scout ford  ', type: 'journey', rank: 'dangerous' }),
    ).toMatchObject({
      ok: true,
      value: { title: 'Scout ford', type: 'journey', rank: 'dangerous' },
    });
  });

  it.each([
    ['missing title', { title: ' ', type: 'journey', rank: 'dangerous' }, 'required'],
    ['unsupported type', { title: 'Track', type: 'ritual', rank: 'dangerous' }, 'unsupported_type'],
    ['unsupported rank', { title: 'Track', type: 'journey', rank: 'minor' }, 'unsupported_rank'],
  ] as const)('rejects %s', (_label, input, code) => {
    const result = validateProgressTrackDetails(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain(code);
  });

  it.each([0, 1, 39, 40])('accepts normal boundary ticks %i', (ticks) => {
    expect(validateProgressTrackTicks({ ticks })).toMatchObject({ ok: true, value: { ticks } });
  });

  it.each([
    ['negative', -1, 'out_of_range', undefined],
    ['too high', 41, 'out_of_range', undefined],
    ['fraction', 1.5, 'not_integer', undefined],
    ['nan', Number.NaN, 'not_numeric', undefined],
    ['string', '4', 'not_numeric', undefined],
    ['conflicting mode', 4, 'unsupported_mode', 'repair'],
  ] as const)('rejects malformed or unsupported normal ticks: %s', (_label, ticks, code, mode) => {
    const result = validateProgressTrackTicks({ ticks, mode: mode as never });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]?.code).toBe(code);
  });

  it('requires explicit manual override mode for nonstandard integer ticks', () => {
    expect(validateProgressTrackTicks({ ticks: 44 }).ok).toBe(false);
    expect(validateProgressTrackTicks({ ticks: 44, mode: 'manual_override' })).toEqual({
      ok: true,
      value: { ticks: 44, mode: 'manual_override' },
    });
  });
});
