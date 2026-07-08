import {
  createDomainEntity,
  type DomainEntity,
  type EntityFactoryOptions,
  type EntityId,
  type ISODateString,
} from '../shared';
import type { ChallengeRank } from '../progress';

export type VowType = 'background' | 'inciting_incident' | 'normal';
export type VowStatus = 'active' | 'fulfilled' | 'forsaken' | 'archived';

export interface VowMilestone {
  readonly id: EntityId;
  readonly title: string;
  readonly createdAt: ISODateString;
  readonly notes?: string;
  readonly progressEventId?: EntityId;
}

export interface VowOutcome {
  readonly resolvedAt?: ISODateString;
  readonly summary?: string;
  readonly rollId?: EntityId;
}

export interface Vow extends DomainEntity {
  readonly title: string;
  readonly type: VowType;
  readonly rank: ChallengeRank;
  readonly status: VowStatus;
  readonly characterId?: EntityId;
  readonly campaignId?: EntityId;
  readonly progressTrackId?: EntityId;
  readonly notes: string;
  readonly milestones: readonly VowMilestone[];
  readonly outcome?: VowOutcome;
}

export interface CreateDefaultVowOptions extends EntityFactoryOptions {
  readonly title: string;
  readonly rank: ChallengeRank;
  readonly type?: VowType;
  readonly characterId?: EntityId;
  readonly campaignId?: EntityId;
  readonly progressTrackId?: EntityId;
}

export const createDefaultVow = (options: CreateDefaultVowOptions): Vow => ({
  ...createDomainEntity(options),
  title: options.title,
  type: options.type ?? 'normal',
  rank: options.rank,
  status: 'active',
  characterId: options.characterId,
  campaignId: options.campaignId,
  progressTrackId: options.progressTrackId,
  notes: '',
  milestones: [],
});
