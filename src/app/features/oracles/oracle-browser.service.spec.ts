import { describe, expect, it } from 'vitest';

import { PROJECT_ORIGINAL_PROVENANCE } from '@domain/content';
import {
  filterReleaseEligibleOracleTables,
  findOracleTableById,
  groupOracleTablesByCategory,
  type BrowsableOracleTable,
} from '@domain/oracles';

import { OracleBrowserService } from './oracle-browser.service';

const approved = (id: string, category = 'Common'): BrowsableOracleTable => ({
  id,
  name: id.endsWith('b') ? 'B Table' : 'A Table',
  category,
  description: 'Project-original approved fixture description.',
  kind: 'table',
  rollRange: { min: 1, max: 2 },
  provenance: {
    ...PROJECT_ORIGINAL_PROVENANCE,
    manifestId: `${id}-manifest`,
    releaseStatus: 'allowed',
    reviewStatus: 'reviewed',
  },
  sourceType: 'project_original',
  entries: [{ id: `${id}:entry`, range: { min: 1, max: 2 }, text: 'Original fixture result' }],
});

describe('oracle browser data filtering', () => {
  it('keeps approved tables and excludes blocked unreviewed and missing-provenance tables', () => {
    const allowed = approved('oracle:approved');
    const blocked = {
      ...approved('oracle:blocked'),
      provenance: { ...allowed.provenance, releaseStatus: 'blocked' as const },
    };
    const unreviewed = {
      ...approved('oracle:unreviewed'),
      provenance: { ...allowed.provenance, reviewStatus: 'unreviewed' as const },
    };
    const missingReviewFlags = {
      ...approved('oracle:missing-flags'),
      provenance: { category: 'project_original' as const, reviewedForUse: true },
    };

    expect(
      filterReleaseEligibleOracleTables([allowed, blocked, unreviewed, missingReviewFlags]).map(
        (table) => table.id,
      ),
    ).toEqual(['oracle:approved']);
  });

  it('excludes a table when an entry has non-release-eligible provenance', () => {
    const table = {
      ...approved('oracle:entry-blocked'),
      entries: [
        {
          id: 'entry:blocked',
          range: { min: 1, max: 2 },
          text: 'Original fixture result',
          provenance: { ...PROJECT_ORIGINAL_PROVENANCE, releaseStatus: 'blocked' as const },
        },
      ],
    };

    expect(filterReleaseEligibleOracleTables([table])).toEqual([]);
  });

  it('groups approved tables by category and sorts names inside each group', () => {
    const groups = groupOracleTablesByCategory([
      { ...approved('oracle:b', 'Travel'), name: 'Waymarker' },
      { ...approved('oracle:a', 'Travel'), name: 'Camp Detail' },
      { ...approved('oracle:c', 'Characters'), name: 'Character Need' },
    ]);

    expect(groups.map((group) => group.category)).toEqual(['Characters', 'Travel']);
    expect(groups[1]?.tables.map((table) => table.name)).toEqual(['Camp Detail', 'Waymarker']);
  });

  it('selects approved tables by stable ID and never returns blocked records', () => {
    const allowed = approved('oracle:stable');
    const blocked = {
      ...approved('oracle:blocked'),
      provenance: { ...allowed.provenance, releaseStatus: 'blocked' as const },
    };

    expect(findOracleTableById([allowed, blocked], 'oracle:stable')?.id).toBe('oracle:stable');
    expect(findOracleTableById([allowed, blocked], 'oracle:blocked')).toBeUndefined();
  });

  it('loads bundled release-eligible tables from the canonical service', async () => {
    const service = new OracleBrowserService();
    const snapshot = await service.loadApprovedTables();

    expect(snapshot.tables.length).toBeGreaterThan(0);
    expect(snapshot.groups.flatMap((group) => group.tables)).toEqual(
      [...snapshot.tables].sort(
        (a, b) =>
          a.category.localeCompare(b.category) ||
          a.name.localeCompare(b.name) ||
          a.id.localeCompare(b.id),
      ),
    );
  });
});
