import {
  isReleaseEligibleProvenance,
  PROJECT_ORIGINAL_PROVENANCE,
  provenanceStateLabel,
  type ContentProvenance,
} from '@domain/content';
import type { EntityId } from '@domain/shared';
import type { ResolvableOracleTable } from '@app/rules/oracles';

export interface BrowsableOracleTable extends ResolvableOracleTable {
  readonly category: string;
  readonly description: string;
}

export interface OracleCategoryGroup {
  readonly category: string;
  readonly tables: readonly BrowsableOracleTable[];
}

const projectOriginal = (manifestId: EntityId): ContentProvenance => ({
  ...PROJECT_ORIGINAL_PROVENANCE,
  manifestId,
  sourceId: manifestId,
});

export const BUNDLED_ORACLE_TABLES: readonly BrowsableOracleTable[] = [
  {
    id: 'oracle:project-original:scene-tone',
    name: 'Scene Tone',
    category: 'Session prompts',
    description: 'A project-original prompt for setting the mood before a scene begins.',
    kind: 'table',
    rollRange: { min: 1, max: 6 },
    provenance: projectOriginal('project-original-scene-tone-oracle'),
    sourceType: 'project_original',
    entries: [
      { id: 'scene-tone-calm', range: { min: 1, max: 2 }, text: 'Quiet pressure' },
      { id: 'scene-tone-shifting', range: { min: 3, max: 4 }, text: 'Changing ground' },
      { id: 'scene-tone-urgent', range: { min: 5, max: 6 }, text: 'Immediate trouble' },
    ],
  },
  {
    id: 'oracle:project-original:travel-detail',
    name: 'Travel Detail',
    category: 'Session prompts',
    description: 'A project-original cue for a notable detail during a journey.',
    kind: 'table',
    rollRange: { min: 1, max: 6 },
    provenance: projectOriginal('project-original-travel-detail-oracle'),
    sourceType: 'project_original',
    entries: [
      { id: 'travel-detail-weather', range: { min: 1, max: 2 }, text: 'Weather leaves a mark' },
      { id: 'travel-detail-sign', range: { min: 3, max: 4 }, text: 'A sign points elsewhere' },
      { id: 'travel-detail-cost', range: { min: 5, max: 6 }, text: 'Progress asks a cost' },
    ],
  },
  {
    id: 'oracle:project-original:npc-need',
    name: 'NPC Need',
    category: 'Characters',
    description: 'A project-original helper for deciding what a supporting character wants now.',
    kind: 'table',
    rollRange: { min: 1, max: 6 },
    provenance: projectOriginal('project-original-npc-need-oracle'),
    sourceType: 'project_original',
    entries: [
      { id: 'npc-need-shelter', range: { min: 1, max: 2 }, text: 'Safety for someone vulnerable' },
      { id: 'npc-need-proof', range: { min: 3, max: 4 }, text: 'Proof before trust' },
      { id: 'npc-need-time', range: { min: 5, max: 6 }, text: 'More time than they have' },
    ],
  },
];

export const filterReleaseEligibleOracleTables = (
  tables: readonly BrowsableOracleTable[],
): readonly BrowsableOracleTable[] =>
  tables.filter(
    (table) =>
      isReleaseEligibleProvenance(table.provenance) &&
      table.entries.every(
        (entry) => !entry.provenance || isReleaseEligibleProvenance(entry.provenance),
      ),
  );

export const groupOracleTablesByCategory = (
  tables: readonly BrowsableOracleTable[],
): readonly OracleCategoryGroup[] => {
  const groups = new Map<string, BrowsableOracleTable[]>();
  for (const table of tables)
    groups.set(table.category, [...(groups.get(table.category) ?? []), table]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupedTables]) => ({
      category,
      tables: [...groupedTables].sort(
        (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
      ),
    }));
};

export const findOracleTableById = (
  tables: readonly BrowsableOracleTable[],
  id: EntityId,
): BrowsableOracleTable | undefined =>
  filterReleaseEligibleOracleTables(tables).find((table) => table.id === id);

export const oracleAvailabilityLabel = (table: BrowsableOracleTable): string =>
  `${provenanceStateLabel(table.provenance)} · ${table.provenance.category.replace('_', ' ')}`;
