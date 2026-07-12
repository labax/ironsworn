import { describe, expect, it } from 'vitest';

import { PROJECT_ORIGINAL_PROVENANCE } from '@domain/content';
import {
  filterOracleTablesForDiscovery,
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

  it('searches table names categories and descriptions without mutating input order', () => {
    const scene = {
      ...approved('oracle:scene', 'Session prompts'),
      name: 'Scene Tone',
      description: 'Mood cue.',
    };
    const npc = {
      ...approved('oracle:npc', 'Characters'),
      name: 'NPC Need',
      description: 'Supporting character wants.',
    };
    const original = [scene, npc] as const;

    expect(
      filterOracleTablesForDiscovery(original, { query: 'scene', category: '', source: 'all' }),
    ).toEqual([scene]);
    expect(
      filterOracleTablesForDiscovery(original, {
        query: 'characters',
        category: '',
        source: 'all',
      }),
    ).toEqual([npc]);
    expect(
      filterOracleTablesForDiscovery(original, { query: 'mood', category: '', source: 'all' }),
    ).toEqual([scene]);
    expect(original.map((table) => table.id)).toEqual(['oracle:scene', 'oracle:npc']);
  });

  it('combines category and source filters after release eligibility excludes blocked content', () => {
    const project = { ...approved('oracle:project', 'Session prompts'), name: 'Project Prompt' };
    const srd = {
      ...approved('oracle:srd', 'Session prompts'),
      name: 'Approved Bundled Prompt',
      provenance: {
        ...PROJECT_ORIGINAL_PROVENANCE,
        category: 'srd_derived' as const,
        releaseStatus: 'allowed' as const,
        reviewStatus: 'reviewed' as const,
      },
      sourceType: 'srd_derived' as const,
    };
    const blocked = {
      ...approved('oracle:blocked', 'Session prompts'),
      name: 'Blocked Prompt',
      provenance: { ...PROJECT_ORIGINAL_PROVENANCE, releaseStatus: 'blocked' as const },
    };
    const releaseEligible = filterReleaseEligibleOracleTables([project, srd, blocked]);

    expect(
      filterOracleTablesForDiscovery(releaseEligible, {
        query: 'prompt',
        category: 'Session prompts',
        source: 'srd_derived',
      }).map((table) => table.id),
    ).toEqual(['oracle:srd']);
  });

  it('returns an empty deterministic no-results view for unmatched queries', () => {
    const tables = [approved('oracle:approved')];

    expect(
      filterOracleTablesForDiscovery(tables, { query: 'zzzz', category: '', source: 'all' }),
    ).toEqual([]);
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
