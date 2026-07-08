import type { Character, JournalEntry, ProgressTrack, RollHistoryEntry, Vow } from '@domain/index';

export interface TestCampaignSave {
  readonly id: string;
  readonly name: string;
  readonly characters: readonly Character[];
  readonly vows: readonly Vow[];
  readonly progressTracks: readonly ProgressTrack[];
  readonly journalEntries: readonly JournalEntry[];
  readonly rollHistory: readonly RollHistoryEntry[];
}
