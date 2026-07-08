import {
  createDomainEntity,
  type DomainEntity,
  type EntityFactoryOptions,
  type EntityId,
} from '../shared';

export type StatKey = 'edge' | 'heart' | 'iron' | 'shadow' | 'wits';
export type DebilityCategory = 'condition' | 'bane' | 'burden';
export type DebilityType = 'wounded' | 'shaken' | 'unprepared' | 'custom';

export type Stats = Record<StatKey, number>;

export interface StatusTracks {
  readonly health: number;
  readonly spirit: number;
  readonly supply: number;
}

export interface MomentumState {
  readonly current: number;
  readonly max: number;
  readonly reset: number;
  readonly hasOverride: boolean;
}

export interface CharacterDebility {
  readonly id: EntityId;
  readonly category: DebilityCategory;
  readonly type: DebilityType;
  readonly label: string;
  readonly notes?: string;
}

export interface Bond {
  readonly id: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly progressTrackId?: EntityId;
}

export interface AssetReference {
  readonly id: EntityId;
  readonly contentId?: EntityId;
  readonly name: string;
  readonly notes?: string;
}

export interface CharacterExperience {
  readonly earned: number;
  readonly spent: number;
}

export interface Character extends DomainEntity {
  readonly name: string;
  readonly pronouns?: string;
  readonly concept?: string;
  readonly campaignId?: EntityId;
  readonly stats: Stats;
  readonly statusTracks: StatusTracks;
  readonly momentum: MomentumState;
  readonly debilities: readonly CharacterDebility[];
  readonly bonds: readonly Bond[];
  readonly assets: readonly AssetReference[];
  readonly equipmentNotes: string;
  readonly notes: string;
  readonly experience: CharacterExperience;
}

export interface CreateDefaultCharacterOptions extends EntityFactoryOptions {
  readonly name: string;
  readonly campaignId?: EntityId;
  readonly pronouns?: string;
  readonly concept?: string;
}

export const createDefaultStats = (): Stats => ({ edge: 1, heart: 1, iron: 1, shadow: 1, wits: 1 });
export const createDefaultStatusTracks = (): StatusTracks => ({ health: 5, spirit: 5, supply: 5 });
export const createDefaultMomentumState = (): MomentumState => ({
  current: 2,
  max: 10,
  reset: 2,
  hasOverride: false,
});

export const isValidStats = (stats: Stats): boolean =>
  Object.values(stats).every((value) => Number.isInteger(value) && value >= 0);

export const isValidStatusTracks = (tracks: StatusTracks): boolean =>
  [tracks.health, tracks.spirit, tracks.supply].every(
    (value) => Number.isInteger(value) && value >= 0 && value <= 5,
  );

export const clampMomentum = (momentum: MomentumState): MomentumState => ({
  ...momentum,
  current: Math.min(momentum.max, Math.max(-6, Math.trunc(momentum.current))),
});

export const isValidMomentum = (momentum: MomentumState): boolean =>
  Number.isInteger(momentum.current) &&
  Number.isInteger(momentum.max) &&
  Number.isInteger(momentum.reset) &&
  momentum.current >= -6 &&
  momentum.current <= momentum.max;

export const createDefaultCharacter = (options: CreateDefaultCharacterOptions): Character => ({
  ...createDomainEntity(options),
  name: options.name,
  pronouns: options.pronouns,
  concept: options.concept,
  campaignId: options.campaignId,
  stats: createDefaultStats(),
  statusTracks: createDefaultStatusTracks(),
  momentum: createDefaultMomentumState(),
  debilities: [],
  bonds: [],
  assets: [],
  equipmentNotes: '',
  notes: '',
  experience: { earned: 0, spent: 0 },
});

export const isCharacter = (value: unknown): value is Character => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Character>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    !!candidate.stats &&
    isValidStats(candidate.stats)
  );
};
