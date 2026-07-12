import { PROJECT_ORIGINAL_PROVENANCE } from '../../domain/content';
import { describe, expect, it } from 'vitest';
import { createFixedRandomProvider } from '../testing';
import { resolveOracleRoll, resolveOracleTableRoll, type ResolvableOracleTable } from './oracles';

const now = () => new Date('2026-01-02T03:04:05.000Z');

const table = (overrides: Partial<ResolvableOracleTable> = {}): ResolvableOracleTable => ({
  id: 'oracle:test-table',
  name: 'Project Original Oracle',
  kind: 'table',
  rollRange: { min: 1, max: 100 },
  provenance: PROJECT_ORIGINAL_PROVENANCE,
  sourceType: 'project_original',
  entries: [
    { id: 'entry:low', range: { min: 1, max: 50 }, text: 'Project original low result' },
    { id: 'entry:high', range: { min: 51, max: 100 }, textRef: 'text:high' },
  ],
  ...overrides,
});

const expectCode = (result: ReturnType<typeof resolveOracleTableRoll>, code: string) => {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.map((error) => error.code)).toContain(code);
};

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

describe('oracle table resolver', () => {
  it('resolves lower and upper boundary rolls to first and last entries', () => {
    const first = resolveOracleTableRoll({ table: table(), fixedRoll: 1, now });
    const last = resolveOracleTableRoll({ table: table(), fixedRoll: 100, now });

    expect(first.ok && first.value.entryId).toBe('entry:low');
    expect(last.ok && last.value.entryId).toBe('entry:high');
  });

  it('supports a one-value declared range shape', () => {
    const result = resolveOracleTableRoll({
      table: table({
        rollRange: { min: 7, max: 7 },
        entries: [{ id: 'entry:only', range: { min: 7, max: 7 }, text: 'Only original result' }],
      }),
      fixedRoll: 7,
      now,
    });

    expect(result.ok && result.value.roll).toBe(7);
    expect(result.ok && result.value.entryId).toBe('entry:only');
  });

  it('supports non-d100 declared ranges', () => {
    const result = resolveOracleTableRoll({
      table: table({
        rollRange: { min: 11, max: 20 },
        entries: [
          { id: 'entry:range', range: { min: 11, max: 20 }, text: 'Custom original result' },
        ],
      }),
      fixedRoll: 20,
      now,
    });

    expect(result.ok && result.value.rollRange).toEqual({ min: 11, max: 20 });
    expect(result.ok && result.value.entryId).toBe('entry:range');
  });

  it('uses injectable fixed randomness within the declared table range', () => {
    const result = resolveOracleTableRoll({
      table: table({
        rollRange: { min: 10, max: 19 },
        entries: [{ id: 'entry:any', range: { min: 10, max: 19 }, text: 'Any original result' }],
      }),
      randomProvider: createFixedRandomProvider([0.9]),
      now,
    });

    expect(result.ok && result.value.roll).toBe(19);
  });

  it('returns a structured provenance-aware result snapshot', () => {
    const entryProvenance = { ...PROJECT_ORIGINAL_PROVENANCE, sourceId: 'entry-source' };
    const result = resolveOracleTableRoll({
      table: table({
        entries: [
          {
            id: 'entry:source',
            range: { min: 1, max: 100 },
            textRef: 'text:source',
            provenance: entryProvenance,
          },
        ],
      }),
      fixedRoll: 12,
      now,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      tableId: 'oracle:test-table',
      tableName: 'Project Original Oracle',
      roll: 12,
      entryId: 'entry:source',
      textRef: 'text:source',
      provenance: entryProvenance,
      tableProvenance: PROJECT_ORIGINAL_PROVENANCE,
      timestamp: '2026-01-02T03:04:05.000Z',
      sourceType: 'project_original',
      tableKind: 'table',
    });
  });

  it('preserves custom and user-authored structural compatibility', () => {
    for (const category of ['custom', 'user_authored'] as const) {
      const result = resolveOracleTableRoll({
        table: table({
          provenance: { category, reviewedForUse: false },
          sourceType: category,
          entries: [
            {
              id: `entry:${category}`,
              range: { min: 1, max: 100 },
              text: `${category} original placeholder`,
            },
          ],
        }),
        fixedRoll: 88,
        now,
      });

      expect(result.ok && result.value.sourceType).toBe(category);
      expect(result.ok && result.value.provenance.category).toBe(category);
    }
  });

  it('rejects empty tables', () => {
    expectCode(
      resolveOracleTableRoll({ table: table({ entries: [] }), fixedRoll: 1, now }),
      'empty_table',
    );
  });

  it('rejects malformed entries without stable content text or reference', () => {
    expectCode(
      resolveOracleTableRoll({
        table: table({ entries: [{ id: 'entry:bad', range: { min: 1, max: 100 } }] }),
        fixedRoll: 1,
        now,
      }),
      'malformed_entry',
    );
  });

  it('rejects invalid table bounds and impossible ranges', () => {
    expectCode(
      resolveOracleTableRoll({
        table: table({ rollRange: { min: 10.5, max: 20 } }),
        fixedRoll: 11,
        now,
      }),
      'invalid_bounds',
    );
    expectCode(
      resolveOracleTableRoll({
        table: table({ rollRange: { min: 20, max: 10 } }),
        fixedRoll: 11,
        now,
      }),
      'impossible_range',
    );
  });

  it('rejects gaps, overlaps, and ambiguous matching ranges', () => {
    expectCode(
      resolveOracleTableRoll({
        table: table({
          entries: [{ id: 'entry:gap', range: { min: 1, max: 90 }, text: 'Gap original' }],
        }),
        fixedRoll: 95,
        now,
      }),
      'gap',
    );
    const overlapping = table({
      entries: [
        { id: 'entry:a', range: { min: 1, max: 60 }, text: 'Overlap original A' },
        { id: 'entry:b', range: { min: 60, max: 100 }, text: 'Overlap original B' },
      ],
    });
    expectCode(resolveOracleTableRoll({ table: overlapping, fixedRoll: 60, now }), 'overlap');
    expectCode(
      resolveOracleTableRoll({ table: overlapping, fixedRoll: 60, now }),
      'ambiguous_match',
    );
  });

  it('rejects out-of-range fixed rolls', () => {
    expectCode(
      resolveOracleTableRoll({ table: table(), fixedRoll: 101, now }),
      'out_of_range_fixed_roll',
    );
  });
});
