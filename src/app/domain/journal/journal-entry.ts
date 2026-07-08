import {
  createDomainEntity,
  type DomainEntity,
  type EntityFactoryOptions,
  type EntityId,
} from '../shared';

export type JournalEntryType =
  | 'session_note'
  | 'vow_note'
  | 'milestone'
  | 'roll_result'
  | 'oracle_result'
  | 'freeform';

export interface JournalLinks {
  readonly characterId?: EntityId;
  readonly campaignId?: EntityId;
  readonly sessionId?: EntityId;
  readonly vowId?: EntityId;
  readonly progressTrackId?: EntityId;
  readonly rollId?: EntityId;
  readonly oracleResultId?: EntityId;
}

export interface JournalEntry extends DomainEntity {
  readonly type: JournalEntryType;
  readonly title: string;
  readonly body: string;
  readonly links: JournalLinks;
  readonly tags: readonly string[];
}

export interface CreateDefaultJournalEntryOptions extends EntityFactoryOptions {
  readonly title: string;
  readonly type?: JournalEntryType;
  readonly body?: string;
  readonly links?: JournalLinks;
  readonly tags?: readonly string[];
}

export const createDefaultJournalEntry = (
  options: CreateDefaultJournalEntryOptions,
): JournalEntry => ({
  ...createDomainEntity(options),
  type: options.type ?? 'session_note',
  title: options.title,
  body: options.body ?? '',
  links: options.links ?? {},
  tags: options.tags ?? [],
});
