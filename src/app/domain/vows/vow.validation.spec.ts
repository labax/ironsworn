import { describe, expect, it } from 'vitest';

import { validateVowDetails } from './vow.validation';

describe('vow validation', () => {
  it('accepts supported values and preserves narrative text', () => {
    const description = 'A user-authored description.\nWith a second line.';
    expect(
      validateVowDetails({
        title: '  Keep the lantern lit  ',
        description,
        rank: 'dangerous',
        status: 'active',
        notes: 'Remember who asked.',
      }),
    ).toMatchObject({
      ok: true,
      value: { title: 'Keep the lantern lit', description, rank: 'dangerous', status: 'active' },
    });
  });

  it.each([
    ['missing title', { title: ' ', rank: 'dangerous', status: 'active' }, 'required'],
    ['unsupported rank', { title: 'Vow', rank: 'minor', status: 'active' }, 'unsupported_rank'],
    [
      'unsupported status',
      { title: 'Vow', rank: 'dangerous', status: 'pending' },
      'unsupported_status',
    ],
  ] as const)('rejects %s', (_label, input, code) => {
    const result = validateVowDetails(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain(code);
  });
});
