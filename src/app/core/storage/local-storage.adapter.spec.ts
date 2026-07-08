import { TestBed } from '@angular/core/testing';
import { createDefaultCharacter } from '@domain/character';
import { createDefaultJournalEntry } from '@domain/journal';
import { createDefaultProgressTrack } from '@domain/progress';
import type { RollHistoryEntry } from '@domain/rolls';
import { createDefaultVow } from '@domain/vows';
import { createCopyableJsonBackup } from './json-backup';
import { createSaveEnvelope, CURRENT_SAVE_SCHEMA_VERSION } from './storage.types';
import {
  BROWSER_STORAGE,
  LocalStorageAdapter,
  type BrowserStorageLike,
} from './local-storage.adapter';
import type { TestCampaignSave } from './test-campaign';

class MemoryStorage implements BrowserStorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const createdAt = '2026-07-08T00:00:00.000Z';
const campaignKey = 'campaign:test';

const createAdapter = (storage: BrowserStorageLike | null): LocalStorageAdapter => {
  TestBed.configureTestingModule({
    providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
  });

  return TestBed.inject(LocalStorageAdapter);
};

const createTestCampaign = (): TestCampaignSave => {
  const campaignId = 'campaign-1';
  const characterId = 'character-1';
  const progressTrackId = 'progress-1';
  const rollId = 'roll-1';
  const character = createDefaultCharacter({
    id: characterId,
    name: 'Test Character',
    campaignId,
    concept: 'Local persistence test persona',
    createdAt,
  });
  const progressTrack = createDefaultProgressTrack({
    id: progressTrackId,
    title: 'Test Track',
    type: 'vow',
    rank: 'troublesome',
    characterId,
    campaignId,
    createdAt,
  });
  const vow = createDefaultVow({
    id: 'vow-1',
    title: 'Test Vow',
    rank: 'troublesome',
    characterId,
    campaignId,
    progressTrackId,
    createdAt,
  });
  const journalEntry = createDefaultJournalEntry({
    id: 'journal-1',
    title: 'Local Persistence Test',
    body: 'Project-original placeholder note for storage tests.',
    links: { campaignId, characterId, rollId },
    createdAt,
  });
  const rollHistoryEntry: RollHistoryEntry = {
    id: rollId,
    schemaVersion: 1,
    recordStatus: 'active',
    createdAt,
    updatedAt: createdAt,
    type: 'action',
    source: 'manual',
    characterId,
    outcome: 'weak_hit',
    isMatch: false,
    notes: 'Placeholder roll notes only.',
  };

  return {
    id: campaignId,
    name: 'Test Campaign',
    characters: [character],
    vows: [vow],
    progressTracks: [progressTrack],
    journalEntries: [journalEntry],
    rollHistory: [rollHistoryEntry],
  };
};

describe('LocalStorageAdapter', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('saves and loads a typed test campaign envelope with schema metadata', async () => {
    const storage = new MemoryStorage();
    const adapter = createAdapter(storage);
    const envelope = createSaveEnvelope(createTestCampaign(), {
      appVersion: 'test',
      savedAt: createdAt,
      metadata: { source: 'unit-test' },
    });

    await expect(adapter.save(campaignKey, envelope)).resolves.toEqual({ success: true });
    const loadResult = await adapter.load<TestCampaignSave>(campaignKey);

    expect(loadResult.success).toBe(true);
    expect(loadResult).toMatchObject({ success: true, found: true });
    if (loadResult.success && loadResult.found) {
      expect(loadResult.data.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
      expect(loadResult.data.payload.name).toBe('Test Campaign');
      expect(loadResult.data.payload.characters[0]?.name).toBe('Test Character');
    }
  });

  it('returns a safe no-data result for missing saved data', async () => {
    const adapter = createAdapter(new MemoryStorage());
    await expect(adapter.load<TestCampaignSave>(campaignKey)).resolves.toEqual({
      success: true,
      found: false,
    });
  });

  it('returns a malformed-data result instead of throwing for corrupt JSON', async () => {
    const storage = new MemoryStorage();
    storage.setItem(campaignKey, '{not-json');
    const adapter = createAdapter(storage);

    const result = await adapter.load<TestCampaignSave>(campaignKey);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('malformed-data');
  });

  it('returns a malformed-data result for JSON without version metadata', async () => {
    const storage = new MemoryStorage();
    storage.setItem(campaignKey, JSON.stringify({ payload: createTestCampaign() }));
    const adapter = createAdapter(storage);

    const result = await adapter.load<TestCampaignSave>(campaignKey);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('malformed-data');
  });

  it('creates copyable JSON backup text for a saved envelope', () => {
    const envelope = createSaveEnvelope(createTestCampaign(), {
      appVersion: 'test',
      savedAt: createdAt,
    });

    const backup = createCopyableJsonBackup(envelope, createdAt);

    expect(backup.success).toBe(true);
    if (backup.success) {
      expect(JSON.parse(backup.value)).toMatchObject({
        exportedAt: createdAt,
        format: 'ironsworn-local-save-json',
        envelope: { schemaVersion: CURRENT_SAVE_SCHEMA_VERSION },
      });
    }
  });

  it('can remove saved data and report existence through the abstraction', async () => {
    const storage = new MemoryStorage();
    const adapter = createAdapter(storage);
    const envelope = createSaveEnvelope(createTestCampaign(), {
      appVersion: 'test',
      savedAt: createdAt,
    });

    await adapter.save(campaignKey, envelope);
    await expect(adapter.exists(campaignKey)).resolves.toBe(true);
    await expect(adapter.remove(campaignKey)).resolves.toEqual({ success: true });
    await expect(adapter.exists(campaignKey)).resolves.toBe(false);
  });
});
