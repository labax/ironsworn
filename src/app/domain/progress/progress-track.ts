import {
  createDomainEntity,
  type DomainEntity,
  type EntityFactoryOptions,
  type EntityId,
  type ISODateString,
} from '../shared';

export type ChallengeRank = 'troublesome' | 'dangerous' | 'formidable' | 'extreme' | 'epic';
export type ProgressTrackType = 'vow' | 'journey' | 'combat' | 'bond' | 'custom';
export type ProgressTrackStatus = 'active' | 'completed' | 'failed' | 'forsaken' | 'archived';

export interface ProgressEvent {
  readonly id: EntityId;
  readonly createdAt: ISODateString;
  readonly ticksDelta: number;
  readonly note?: string;
  readonly rollId?: EntityId;
}

export interface ProgressTrack extends DomainEntity {
  readonly type: ProgressTrackType;
  readonly title: string;
  readonly rank: ChallengeRank;
  readonly ticks: number;
  readonly status: ProgressTrackStatus;
  readonly characterId?: EntityId;
  readonly campaignId?: EntityId;
  readonly events: readonly ProgressEvent[];
  readonly notes?: string;
}

export interface CreateDefaultProgressTrackOptions extends EntityFactoryOptions {
  readonly title: string;
  readonly type: ProgressTrackType;
  readonly rank: ChallengeRank;
  readonly characterId?: EntityId;
  readonly campaignId?: EntityId;
  readonly notes?: string;
}

export const MIN_PROGRESS_TICKS = 0;
export const MAX_PROGRESS_TICKS = 40;

export const clampProgressTicks = (ticks: number): number =>
  Math.min(MAX_PROGRESS_TICKS, Math.max(MIN_PROGRESS_TICKS, Math.trunc(ticks)));

export const isValidProgressTicks = (ticks: number): boolean =>
  Number.isInteger(ticks) && ticks >= MIN_PROGRESS_TICKS && ticks <= MAX_PROGRESS_TICKS;

export const createDefaultProgressTrack = (
  options: CreateDefaultProgressTrackOptions,
): ProgressTrack => ({
  ...createDomainEntity(options),
  type: options.type,
  title: options.title,
  rank: options.rank,
  ticks: 0,
  status: 'active',
  characterId: options.characterId,
  campaignId: options.campaignId,
  events: [],
  notes: options.notes,
});

export const isProgressTrack = (value: unknown): value is ProgressTrack => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ProgressTrack>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    isValidProgressTicks(candidate.ticks ?? NaN)
  );
};
