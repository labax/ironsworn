import type { DomainEntity, EntityId } from '../shared';

export type RollType = 'action' | 'progress' | 'oracle';
export type RollOutcome = 'strong_hit' | 'weak_hit' | 'miss' | 'oracle_result' | 'yes' | 'no';
export type RollSource = 'generated' | 'manual';

export interface ActionRollDice {
  readonly actionDie: number;
  readonly challengeDice: readonly [number, number];
  readonly statBonus?: number;
  readonly adds?: number;
}

export interface ProgressRollDice {
  readonly progressScore: number;
  readonly challengeDice: readonly [number, number];
}

export interface OracleRollDice {
  readonly roll: number;
}

export interface MomentumBurn {
  readonly burned: boolean;
  readonly previousMomentum?: number;
  readonly replacementScore?: number;
}

export interface RollHistoryEntry extends DomainEntity {
  readonly type: RollType;
  readonly source: RollSource;
  readonly characterId?: EntityId;
  readonly moveId?: EntityId;
  readonly progressTrackId?: EntityId;
  readonly oracleTableId?: EntityId;
  readonly outcome: RollOutcome;
  readonly actionRoll?: ActionRollDice;
  readonly progressRoll?: ProgressRollDice;
  readonly oracleRoll?: OracleRollDice;
  readonly isMatch: boolean;
  readonly momentumBurn?: MomentumBurn;
  readonly notes?: string;
}
