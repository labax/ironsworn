import {
  createDomainEntity,
  type DomainEntity,
  type EntityFactoryOptions,
  type EntityId,
} from '../shared';
import type { RollHistoryEntry } from '../rolls';

export type JournalEntryType =
  'session_note' | 'vow_note' | 'milestone' | 'roll_result' | 'oracle_result' | 'freeform';

export type JournalSourceType = 'roll' | 'oracle';

export interface JournalLinks {
  readonly characterId?: EntityId;
  readonly campaignId?: EntityId;
  readonly sessionId?: EntityId;
  readonly vowId?: EntityId;
  readonly progressTrackId?: EntityId;
  readonly rollId?: EntityId;
  readonly oracleResultId?: EntityId;
}

export interface JournalSourceReference {
  readonly id: EntityId;
  readonly type: JournalSourceType;
  readonly label: string;
}

export type JournalSnapshot =
  | { readonly type: 'roll'; readonly roll: RollHistoryEntry }
  | { readonly type: 'oracle'; readonly roll: RollHistoryEntry };

export interface JournalEntry extends DomainEntity {
  readonly type: JournalEntryType;
  readonly title: string;
  readonly body: string;
  readonly links: JournalLinks;
  readonly sourceReferences: readonly JournalSourceReference[];
  readonly snapshots: readonly JournalSnapshot[];
  readonly tags: readonly string[];
  readonly sessionLabel?: string;
}

export interface CreateDefaultJournalEntryOptions extends EntityFactoryOptions {
  readonly title: string;
  readonly type?: JournalEntryType;
  readonly body?: string;
  readonly links?: JournalLinks;
  readonly sourceReferences?: readonly JournalSourceReference[];
  readonly snapshots?: readonly JournalSnapshot[];
  readonly tags?: readonly string[];
  readonly sessionLabel?: string;
}

export const cloneJournalEntry = (entry: JournalEntry): JournalEntry => ({
  ...entry,
  links: { ...entry.links },
  sourceReferences: entry.sourceReferences.map((reference) => ({ ...reference })),
  snapshots: entry.snapshots.map((snapshot) => ({
    type: snapshot.type,
    roll: {
      ...snapshot.roll,
      actionRoll: snapshot.roll.actionRoll
        ? {
            ...snapshot.roll.actionRoll,
            challengeDice: [...snapshot.roll.actionRoll.challengeDice] as [number, number],
          }
        : undefined,
      progressRoll: snapshot.roll.progressRoll
        ? {
            ...snapshot.roll.progressRoll,
            challengeDice: [...snapshot.roll.progressRoll.challengeDice] as [number, number],
          }
        : undefined,
      oracleRoll: snapshot.roll.oracleRoll
        ? {
            ...snapshot.roll.oracleRoll,
            entryRange: { ...snapshot.roll.oracleRoll.entryRange },
            provenance: { ...snapshot.roll.oracleRoll.provenance },
            tableProvenance: { ...snapshot.roll.oracleRoll.tableProvenance },
          }
        : undefined,
    },
  })),
  tags: [...entry.tags],
});

export const createDefaultJournalEntry = (
  options: CreateDefaultJournalEntryOptions,
): JournalEntry => ({
  ...createDomainEntity(options),
  type: options.type ?? 'session_note',
  title: options.title,
  body: options.body ?? '',
  links: options.links ?? {},
  sourceReferences: options.sourceReferences ?? [],
  snapshots: options.snapshots ?? [],
  tags: options.tags ?? [],
  sessionLabel: options.sessionLabel?.trim() || undefined,
});
