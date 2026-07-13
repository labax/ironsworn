import type { ContentProvenance } from '../content';
import type { DomainEntity, EntityId, ISODateString } from '../shared';

export type RollType = 'action' | 'progress' | 'oracle';
export type RollOutcome = 'strong_hit' | 'weak_hit' | 'miss' | 'oracle_result' | 'yes' | 'no';
export type RollSource = 'generated' | 'manual';

export interface ActionRollDice {
  readonly actionDie: number;
  readonly challengeDice: readonly [number, number];
  readonly statBonus?: number;
  readonly adds?: number;
  readonly actionScore?: number;
}

export interface ProgressRollDice {
  readonly progressScore: number;
  readonly challengeDice: readonly [number, number];
}

export interface OracleRollDice {
  readonly roll: number;
}

export interface OracleRollSnapshot extends OracleRollDice {
  readonly tableId: EntityId;
  readonly tableName: string;
  readonly tableKind: string;
  readonly entryId: EntityId;
  readonly entryRange: { readonly min: number; readonly max: number };
  readonly resultText?: string;
  readonly resultTextRef?: EntityId;
  readonly resolvedAt: ISODateString;
  readonly questionContext?: string;
  readonly provenance: ContentProvenance;
  readonly tableProvenance: ContentProvenance;
}

export interface MomentumBurn {
  readonly applied: boolean;
  readonly canceledDice: readonly { readonly position: 0 | 1; readonly value: number }[];
  readonly momentumUsed: number;
  readonly resetValue: number;
  readonly initialOutcome: Extract<RollOutcome, 'strong_hit' | 'weak_hit' | 'miss'>;
  readonly finalOutcome: Extract<RollOutcome, 'strong_hit' | 'weak_hit' | 'miss'>;
  readonly originalMatch: boolean;
}

export interface RollHistoryEntry extends DomainEntity {
  readonly type: RollType;
  readonly source: RollSource;
  readonly characterId?: EntityId;
  readonly moveId?: EntityId;
  readonly progressTrackId?: EntityId;
  readonly oracleTableId?: EntityId;
  readonly oracleEntryId?: EntityId;
  readonly outcome: RollOutcome;
  readonly label?: string;
  readonly actionRoll?: ActionRollDice;
  readonly progressRoll?: ProgressRollDice;
  readonly oracleRoll?: OracleRollSnapshot;
  readonly isMatch: boolean;
  readonly momentumBurn?: MomentumBurn;
  readonly notes?: string;
}
