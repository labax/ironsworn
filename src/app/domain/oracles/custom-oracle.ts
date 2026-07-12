import type { ContentProvenance } from '@domain/content';
import type { EntityId } from '@domain/shared';
import type { OracleDieRange, OracleTableEntry, ResolvableOracleTable } from '@app/rules/oracles';

export const CUSTOM_ORACLE_PROVENANCE: ContentProvenance & { readonly category: 'custom' } = {
  category: 'custom',
  title: 'User-authored custom oracle table',
  reviewedForUse: false,
  releaseStatus: 'review-required',
  reviewStatus: 'unreviewed',
};

export interface CustomOracleTable extends ResolvableOracleTable {
  readonly category: string;
  readonly description: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly provenance: ContentProvenance & { readonly category: 'custom' | 'user_authored' };
  readonly sourceType: 'custom' | 'user_authored';
}

export interface CustomOracleEntryInput {
  readonly id?: EntityId;
  readonly min: unknown;
  readonly max: unknown;
  readonly text: unknown;
}

export interface SaveCustomOracleTableInput {
  readonly id?: EntityId;
  readonly name: unknown;
  readonly category: unknown;
  readonly description?: unknown;
  readonly rollMin: unknown;
  readonly rollMax: unknown;
  readonly entries: readonly CustomOracleEntryInput[];
}

export const cloneCustomOracleTable = (table: CustomOracleTable): CustomOracleTable => ({
  ...table,
  rollRange: { ...table.rollRange },
  provenance: { ...table.provenance },
  entries: table.entries.map((entry) => ({
    ...entry,
    range: { ...entry.range },
    provenance: entry.provenance ? { ...entry.provenance } : undefined,
    metadata: entry.metadata ? { ...entry.metadata } : undefined,
  })),
  metadata: table.metadata ? { ...table.metadata } : undefined,
});

const customProvenance = (tableId: EntityId): CustomOracleTable['provenance'] => ({
  ...CUSTOM_ORACLE_PROVENANCE,
  sourceId: tableId,
  title: 'User-authored custom oracle table',
});

export const toCustomOracleTable = (input: {
  readonly id: EntityId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly name: string;
  readonly category: string;
  readonly description?: string;
  readonly rollRange: OracleDieRange;
  readonly entries: readonly OracleTableEntry[];
}): CustomOracleTable => ({
  id: input.id,
  name: input.name,
  category: input.category,
  description: input.description ?? 'User-authored custom oracle table.',
  kind: 'table',
  rollRange: { ...input.rollRange },
  provenance: customProvenance(input.id),
  sourceType: 'custom',
  createdAt: input.createdAt,
  updatedAt: input.updatedAt,
  entries: input.entries.map((entry) => ({
    ...entry,
    range: { ...entry.range },
    provenance: customProvenance(input.id),
  })),
  metadata: { contentClass: 'runtime-custom', bundled: false },
});
