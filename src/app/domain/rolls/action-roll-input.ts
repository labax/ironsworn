import type { StatKey } from '@domain/character';

export type ActionRollInputSource = 'character-stat' | 'manual';

export interface PreparedActionRollInput {
  readonly label?: string;
  readonly statKey?: StatKey;
  readonly statValue: number;
  readonly adds: number;
  readonly source: ActionRollInputSource;
}
