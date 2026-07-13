import { filterRollHistory, hasActiveRollHistoryFilters } from './roll-history-filters';
import type { RollHistoryEntry } from './roll-history-entry';

const base = (overrides: Partial<RollHistoryEntry>): RollHistoryEntry => ({
  id: overrides.id ?? 'roll-1',
  createdAt: overrides.createdAt ?? '2026-07-09T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? overrides.createdAt ?? '2026-07-09T00:00:00.000Z',
  schemaVersion: 1,
  recordStatus: 'active',
  type: overrides.type ?? 'action',
  source: overrides.source ?? 'generated',
  outcome: overrides.outcome ?? 'weak_hit',
  isMatch: overrides.isMatch ?? false,
  ...overrides,
});

const entries = (): readonly RollHistoryEntry[] => [
  base({
    id: 'action-1',
    type: 'action',
    createdAt: '2026-07-09T10:00:00.000Z',
    label: 'Scout the long ravine label with many user authored words',
    notes: 'Remember the rope note.',
    actionRoll: { actionDie: 4, challengeDice: [2, 7], actionScore: 5 },
  }),
  base({
    id: 'progress-1',
    type: 'progress',
    createdAt: '2026-07-10T10:00:00.000Z',
    progressRoll: {
      progressScore: 6,
      challengeDice: [3, 8],
      trackId: 'track-1',
      trackType: 'journey',
      trackTitle: 'Finish the bridge crossing',
      vowTitle: 'Keep the caravan safe',
      resolvedAt: '2026-07-10T10:00:00.000Z',
    },
    notes: 'Progress note marker.',
  }),
  base({
    id: 'oracle-1',
    type: 'oracle',
    createdAt: '2026-07-11T10:00:00.000Z',
    outcome: 'oracle_result',
    oracleRoll: {
      roll: 4,
      tableId: 'oracle-1',
      tableName: 'Weather Turns',
      tableKind: 'table',
      entryId: 'entry-1',
      entryRange: { min: 4, max: 6 },
      resultText: 'Rain begins',
      resolvedAt: '2026-07-11T10:00:00.000Z',
      questionContext: 'Will the guide return?',
      provenance: {
        category: 'project_original',
        title: 'Oracle entry source title',
        license: 'Project original',
        releaseStatus: 'allowed',
        reviewStatus: 'reviewed',
        reviewedForUse: true,
      },
      tableProvenance: {
        category: 'project_original',
        title: 'Oracle table source title',
        license: 'Project original',
        releaseStatus: 'allowed',
        reviewStatus: 'reviewed',
        reviewedForUse: true,
      },
    },
  }),
];

describe('roll history filters', () => {
  it('filters each record type without mutating the source entries', () => {
    const source = entries();
    const before = JSON.stringify(source);

    expect(filterRollHistory(source, { types: ['action'] }).map((entry) => entry.id)).toEqual([
      'action-1',
    ]);
    expect(filterRollHistory(source, { types: ['progress'] }).map((entry) => entry.id)).toEqual([
      'progress-1',
    ]);
    expect(filterRollHistory(source, { types: ['oracle'] }).map((entry) => entry.id)).toEqual([
      'oracle-1',
    ]);
    expect(JSON.stringify(source)).toBe(before);
  });

  it('filters inclusive date boundaries and keeps newest-first chronological ordering', () => {
    expect(
      filterRollHistory(entries(), { dateFrom: '2026-07-10', dateTo: '2026-07-11' }).map(
        (entry) => entry.id,
      ),
    ).toEqual(['oracle-1', 'progress-1']);
  });

  it('matches user-authored labels, context, notes, and source-title snapshots', () => {
    const source = entries();

    expect(filterRollHistory(source, { query: 'ravine label' }).map((entry) => entry.id)).toEqual([
      'action-1',
    ]);
    expect(
      filterRollHistory(source, { query: 'progress note marker' }).map((entry) => entry.id),
    ).toEqual(['progress-1']);
    expect(filterRollHistory(source, { query: 'guide return' }).map((entry) => entry.id)).toEqual([
      'oracle-1',
    ]);
    expect(
      filterRollHistory(source, { query: 'table source title' }).map((entry) => entry.id),
    ).toEqual(['oracle-1']);
  });

  it('combines text, type, and date filters deterministically', () => {
    expect(
      filterRollHistory(entries(), {
        query: 'crossing',
        types: ['action', 'progress'],
        dateFrom: '2026-07-10',
      }).map((entry) => entry.id),
    ).toEqual(['progress-1']);
  });

  it('reports active filters for reset controls', () => {
    expect(hasActiveRollHistoryFilters({})).toBe(false);
    expect(hasActiveRollHistoryFilters({ query: '  bridge  ' })).toBe(true);
    expect(hasActiveRollHistoryFilters({ types: ['oracle'] })).toBe(true);
  });
});
