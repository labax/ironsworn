import type { ContentProvenance } from '../content';
import type { DomainEntity, EntityId } from '../shared';

export type OracleTableKind = 'table' | 'yes_no';
export type OracleOdds = 'almost_certain' | 'likely' | 'fifty_fifty' | 'unlikely' | 'small_chance';

export interface OracleResultRange {
  readonly min: number;
  readonly max: number;
  readonly label?: string;
}

export interface OracleTableMetadata extends DomainEntity {
  readonly title: string;
  readonly kind: OracleTableKind;
  readonly provenance: ContentProvenance;
  readonly resultRanges: readonly OracleResultRange[];
  readonly description?: string;
}

export interface OracleRollResult extends DomainEntity {
  readonly tableId: EntityId;
  readonly characterId?: EntityId;
  readonly roll: number;
  readonly odds?: OracleOdds;
  readonly matchedRange?: OracleResultRange;
  readonly resultLabel?: string;
  readonly rollHistoryEntryId?: EntityId;
  readonly notes?: string;
}
