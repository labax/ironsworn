import {
  createDomainEntity,
  type DomainEntity,
  type EntityFactoryOptions,
  type EntityId,
  type ISODateString,
} from '../shared';
import type { ChallengeRank } from '../progress';

export type VowType = 'background' | 'inciting_incident' | 'normal';
export const VOW_STATUSES = ['active', 'fulfilled', 'forsaken', 'archived'] as const;
export type VowStatus = (typeof VOW_STATUSES)[number];

export const VOW_STATUS_LABELS: Record<VowStatus, string> = {
  active: 'Active',
  fulfilled: 'Fulfilled',
  forsaken: 'Forsaken',
  archived: 'Archived',
};

export const isVowStatus = (value: unknown): value is VowStatus =>
  typeof value === 'string' && VOW_STATUSES.includes(value as VowStatus);

export interface VowMilestone {
  readonly id: EntityId;
  readonly createdAt: ISODateString;
  readonly updatedAt?: ISODateString;
  readonly note?: string;
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
  readonly description?: string;
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
  readonly description?: string;
  readonly status?: VowStatus;
  readonly notes?: string;
}

export const createDefaultVow = (options: CreateDefaultVowOptions): Vow => ({
  ...createDomainEntity(options),
  title: options.title,
  type: options.type ?? 'normal',
  rank: options.rank,
  status: options.status ?? 'active',
  description: options.description,
  characterId: options.characterId,
  campaignId: options.campaignId,
  progressTrackId: options.progressTrackId,
  notes: options.notes ?? '',
  milestones: [],
});
