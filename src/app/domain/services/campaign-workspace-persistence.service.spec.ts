import { TestBed } from '@angular/core/testing';

import { BROWSER_STORAGE, createSaveEnvelope, type BrowserStorageLike } from '@app/core/storage';
import { CURRENT_SAVE_SCHEMA_VERSION } from '@app/core/storage/storage.types';
import { createDefaultJournalEntry, type JournalEntry } from '@app/domain/journal';
import { createDefaultProgressTrack, type ProgressTrack } from '@app/domain/progress';
import { createDefaultVow, type Vow } from '@app/domain/vows';

import { CampaignWorkspaceService } from './campaign-workspace.service';
import {
  CAMPAIGN_WORKSPACE_STORAGE_KEY,
  CampaignWorkspacePersistenceService,
  toPersistedCampaignWorkspace,
} from './campaign-workspace-persistence.service';
import { migratePersistedCampaignWorkspace } from './campaign-workspace-persistence.migrations';

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

class FailingSetStorage extends MemoryStorage {
  override setItem(): void {
    throw new Error('Storage disabled for test');
  }
}

class FailingGetStorage extends MemoryStorage {
  override getItem(): string | null {
    throw new Error('Storage disabled for test');
  }
}

const createdAt = '2026-07-01T00:00:00.000Z';
const updatedAt = '2026-07-02T00:00:00.000Z';

const track = (overrides: Partial<ProgressTrack> = {}): ProgressTrack => ({
  ...createDefaultProgressTrack({
    id: 'track-default',
    createdAt,
    title: 'User-authored track',
    type: 'vow',
    rank: 'dangerous',
    notes: 'Line one\nLine two',
  }),
  updatedAt,
  ...overrides,
});

const configure = (storage: BrowserStorageLike | null): CampaignWorkspacePersistenceService => {
  TestBed.configureTestingModule({ providers: [{ provide: BROWSER_STORAGE, useValue: storage }] });
  return TestBed.inject(CampaignWorkspacePersistenceService);
};

describe('CampaignWorkspacePersistenceService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('round-trips multiple progress tracks with stable IDs, ordering fields, links, notes, and overrides', async () => {
    const storage = new MemoryStorage();
    const service = configure(storage);
    const tracks = [
      track({
        id: 'track-first',
        type: 'journey',
        rank: 'formidable',
        ticks: 16,
        characterId: 'character-1',
        campaignId: 'campaign-1',
        status: 'active',
        events: [{ id: 'event-1', createdAt, ticksDelta: 4, note: 'Reached ford' }],
      }),
      track({
        id: 'track-second',
        createdAt: '2026-07-03T00:00:00.000Z',
        title: 'Manual progress',
        type: 'custom',
        rank: 'epic',
        ticks: 44,
        status: 'archived',
        notes: 'Preserve exact user text  ',
        progressMode: 'manual_override',
        overrideReason: 'Confirmed table correction',
      }),
    ];

    const result = await service.saveWorkspace(
      toPersistedCampaignWorkspace({
        progressTracks: tracks,
        selectedProgressTrackId: 'track-second',
      }),
    );
    expect(result).toEqual({ success: true });
    expect(service.saveStatus()).toBe('saved');

    const raw = storage.getItem(CAMPAIGN_WORKSPACE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw ?? '{}') as { schemaVersion: number; payload: unknown };
    expect(saved.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);

    const loaded = await service.loadWorkspace();
    expect(loaded).toMatchObject({ success: true, found: true });
    if (loaded.success && loaded.found) {
      expect(loaded.workspace.selectedProgressTrackId).toBe('track-second');
      expect(loaded.workspace.progressTracks).toEqual(tracks);
    }
  });

  it('reports load failure without throwing for corrupt envelopes', async () => {
    const storage = new MemoryStorage();
    storage.setItem(CAMPAIGN_WORKSPACE_STORAGE_KEY, '{not-json');
    const service = configure(storage);

    const result = await service.loadWorkspace();

    expect(result).toMatchObject({ success: false, error: { code: 'malformed-data' } });
    expect(service.loadFailed()).toBe(true);
  });

  it('reports save failure without clearing in-memory callers', async () => {
    const service = configure(new FailingSetStorage());

    const result = await service.saveWorkspace(
      toPersistedCampaignWorkspace({ progressTracks: [track()], selectedProgressTrackId: null }),
    );

    expect(result.success).toBe(false);
    expect(service.saveStatus()).toBe('failed');
    expect(service.lastSaveResult()).toBe(result);
  });

  it('reports storage load failure through recoverable status', async () => {
    const service = configure(new FailingGetStorage());

    const result = await service.loadWorkspace();

    expect(result.success).toBe(false);
    expect(service.loadFailed()).toBe(true);
    expect(service.lastLoadError()).toMatchObject({ code: 'unknown' });
  });
});

describe('campaign workspace migrations', () => {
  it('uses neutral empty defaults for older workspace saves without progress tracks', () => {
    const migrated = migratePersistedCampaignWorkspace(
      createSaveEnvelope({}, { appVersion: 'test', savedAt: createdAt, schemaVersion: 1 }),
    );

    expect(migrated).toEqual({
      progressTracks: [],
      selectedProgressTrackId: undefined,
      vows: [],
      selectedVowId: undefined,
    });
  });

  it('preserves valid sibling tracks while dropping one malformed optional track record', () => {
    const valid = track({ id: 'valid-track' });
    const migrated = migratePersistedCampaignWorkspace(
      createSaveEnvelope(
        { progressTracks: [valid, { ...valid, id: '', title: 'Malformed' }] },
        { appVersion: 'test', savedAt: createdAt, schemaVersion: CURRENT_SAVE_SCHEMA_VERSION },
      ),
    );

    expect(migrated?.progressTracks).toEqual([valid]);
  });

  it('rejects corrupt required workspace payloads safely', () => {
    const migrated = migratePersistedCampaignWorkspace(
      createSaveEnvelope([], { appVersion: 'test', savedAt: createdAt }),
    );

    expect(migrated).toBeNull();
  });

  it('is idempotent for current-schema workspace records', () => {
    const current = toPersistedCampaignWorkspace({
      progressTracks: [track({ id: 'current-track', progressMode: 'manual_override', ticks: 45 })],
      selectedProgressTrackId: 'current-track',
    });

    expect(
      migratePersistedCampaignWorkspace(
        createSaveEnvelope(current, {
          appVersion: 'test',
          savedAt: createdAt,
          schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        }),
      ),
    ).toEqual(current);
  });
});

describe('CampaignWorkspaceService startup recovery', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('restores progress tracks during startup and preserves in-memory state on invalid loaded data', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      CAMPAIGN_WORKSPACE_STORAGE_KEY,
      JSON.stringify(
        createSaveEnvelope(
          {
            progressTracks: [track({ id: 'loaded-track' })],
            selectedProgressTrackId: 'loaded-track',
          },
          { appVersion: 'test', savedAt: createdAt },
        ),
      ),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    });
    const workspace = TestBed.inject(CampaignWorkspaceService);

    await workspace.loadSavedWorkspace();
    expect(workspace.progressTracks().map((item) => item.id)).toEqual(['loaded-track']);
    expect(workspace.selectedProgressTrackId()).toBe('loaded-track');

    storage.setItem(
      CAMPAIGN_WORKSPACE_STORAGE_KEY,
      JSON.stringify(createSaveEnvelope([], { appVersion: 'test' })),
    );
    await workspace.loadSavedWorkspace();
    expect(workspace.progressTracks().map((item) => item.id)).toEqual(['loaded-track']);
  });
});

const fullVowFixture = (overrides: Partial<Vow> = {}): Vow => ({
  ...createDefaultVow({
    id: 'vow-alpha',
    createdAt,
    updatedAt,
    title: 'Keep my own words intact',
    description: 'Line one.\nLine two with  spaces preserved. ',
    rank: 'formidable',
    status: 'fulfilled',
    notes: 'Player note with\nblank lines\n\nand trailing space. ',
    progressTrackId: 'track-alpha',
    characterId: 'character-alpha',
    campaignId: 'campaign-alpha',
  }),
  milestones: [
    {
      id: 'milestone-alpha',
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
      note: 'Player-authored milestone. ',
    },
  ],
  outcome: {
    resolvedAt: '2026-07-05T00:00:00.000Z',
    summary: 'Player-authored outcome. ',
    rollId: 'roll-alpha',
  },
  ...overrides,
});

describe('CampaignWorkspacePersistenceService vow persistence', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('round-trips multiple complete vows without duplicating linked progress data', async () => {
    const storage = new MemoryStorage();
    const service = configure(storage);
    const vows = [
      fullVowFixture(),
      fullVowFixture({ id: 'vow-beta', createdAt: '2026-07-06T00:00:00.000Z' }),
    ];

    await expect(
      service.saveWorkspace(
        toPersistedCampaignWorkspace({
          progressTracks: [track({ id: 'track-alpha', ticks: 20 })],
          selectedProgressTrackId: 'track-alpha',
          vows,
          selectedVowId: 'vow-beta',
        }),
      ),
    ).resolves.toEqual({ success: true });

    const saved = JSON.parse(storage.getItem(CAMPAIGN_WORKSPACE_STORAGE_KEY) ?? '{}') as {
      payload: { vows: Vow[]; progressTracks: unknown[] };
    };
    expect(saved.payload.vows).toEqual(vows);
    expect(saved.payload.vows[0]).not.toHaveProperty('ticks');
    expect(saved.payload.progressTracks).toHaveLength(1);

    const loaded = await service.loadWorkspace();
    expect(loaded).toMatchObject({ success: true, found: true });
    if (loaded.success && loaded.found) {
      expect(loaded.workspace.vows).toEqual(vows);
      expect(loaded.workspace.selectedVowId).toBe('vow-beta');
      expect(loaded.workspace.progressTracks[0]?.ticks).toBe(20);
    }
  });

  it('migrates older workspace saves with neutral vow defaults', () => {
    const migrated = migratePersistedCampaignWorkspace(
      createSaveEnvelope(
        { progressTracks: [track({ id: 'legacy-track' })] },
        { appVersion: 'test', savedAt: createdAt, schemaVersion: 1 },
      ),
    );

    expect(migrated?.vows).toEqual([]);
  });

  it('is idempotent for current-schema vow records', () => {
    const current = toPersistedCampaignWorkspace({
      progressTracks: [track({ id: 'track-alpha' })],
      vows: [fullVowFixture()],
      selectedVowId: 'vow-alpha',
    });

    expect(
      migratePersistedCampaignWorkspace(
        createSaveEnvelope(current, {
          appVersion: 'test',
          savedAt: createdAt,
          schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        }),
      ),
    ).toEqual(current);
  });

  it('uses neutral defaults for missing optional vow data while preserving required text exactly', () => {
    const migrated = migratePersistedCampaignWorkspace(
      createSaveEnvelope(
        {
          progressTracks: [],
          vows: [
            {
              id: 'vow-min',
              createdAt,
              title: '  Player spacing stays  ',
              rank: 'dangerous',
              status: 'active',
            },
          ],
        },
        { appVersion: 'test', savedAt: createdAt, schemaVersion: CURRENT_SAVE_SCHEMA_VERSION },
      ),
    );

    expect(migrated?.vows[0]).toMatchObject({
      title: '  Player spacing stays  ',
      notes: '',
      milestones: [],
      type: 'normal',
    });
  });

  it('preserves valid sibling vows when one optional record is malformed', () => {
    const migrated = migratePersistedCampaignWorkspace(
      createSaveEnvelope(
        { progressTracks: [], vows: [fullVowFixture(), { id: 'broken', rank: 'dangerous' }] },
        { appVersion: 'test', savedAt: createdAt },
      ),
    );

    expect(migrated?.vows.map((vow) => vow.id)).toEqual(['vow-alpha']);
  });

  it('keeps orphan linked track IDs and drops malformed link values safely', () => {
    const migrated = migratePersistedCampaignWorkspace(
      createSaveEnvelope(
        {
          progressTracks: [],
          vows: [
            fullVowFixture({ progressTrackId: 'missing-track' }),
            { ...fullVowFixture({ id: 'vow-bad-link' }), progressTrackId: 42 },
          ],
        },
        { appVersion: 'test', savedAt: createdAt },
      ),
    );

    expect(migrated?.vows.find((vow) => vow.id === 'vow-alpha')?.progressTrackId).toBe(
      'missing-track',
    );
    expect(migrated?.vows.some((vow) => vow.id === 'vow-bad-link')).toBe(false);
  });

  it('exposes save and load storage failures as recoverable status', async () => {
    const saveService = configure(new FailingSetStorage());
    const saved = await saveService.saveWorkspace(
      toPersistedCampaignWorkspace({ progressTracks: [], vows: [fullVowFixture()] }),
    );
    expect(saved.success).toBe(false);
    expect(saveService.saveStatus()).toBe('failed');

    TestBed.resetTestingModule();
    const loadService = configure(new FailingGetStorage());
    const loaded = await loadService.loadWorkspace();
    expect(loaded.success).toBe(false);
    expect(loadService.lastLoadError()?.code).toBe('unknown');
  });
});

const journalFixture = (overrides: Partial<JournalEntry> = {}): JournalEntry =>
  createDefaultJournalEntry({
    id: 'journal-alpha',
    createdAt: '2026-07-04T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z',
    title: 'Project-original session journal',
    body: `First line with punctuation: ?!;—

Second line keeps trailing spaces.${'  '}\n${'Long player-authored sentence. '.repeat(90)}`,
    type: 'oracle_result',
    links: {
      campaignId: 'campaign-alpha',
      characterId: 'character-alpha',
      sessionId: 'session-alpha',
      vowId: 'vow-alpha',
      progressTrackId: 'track-alpha',
      rollId: 'roll-alpha',
      oracleResultId: 'oracle-alpha',
    },
    sourceReferences: [
      { id: 'roll-alpha', type: 'roll', label: 'Player roll snapshot' },
      { id: 'oracle-alpha', type: 'oracle', label: 'Player oracle snapshot' },
    ],
    snapshots: [
      {
        type: 'oracle',
        roll: {
          id: 'oracle-alpha',
          schemaVersion: 1,
          recordStatus: 'active',
          createdAt: '2026-07-04T00:00:00.000Z',
          updatedAt: '2026-07-04T00:00:00.000Z',
          type: 'oracle',
          source: 'generated',
          outcome: 'oracle_result',
          label: 'Project-original oracle answer',
          oracleTableId: 'custom-table-alpha',
          oracleEntryId: 'custom-entry-alpha',
          isMatch: false,
          oracleRoll: {
            roll: 42,
            tableId: 'custom-table-alpha',
            tableName: 'Player custom table',
            tableKind: 'table',
            entryId: 'custom-entry-alpha',
            entryRange: { min: 41, max: 45 },
            resultText: 'Project-original generated snapshot text.',
            resultTextRef: 'custom-entry-alpha',
            resolvedAt: '2026-07-04T00:00:00.000Z',
            questionContext: 'Player-authored question?',
            provenance: {
              category: 'user_authored',
              sourceId: 'custom-table-alpha',
              reviewedForUse: true,
            },
            tableProvenance: {
              category: 'custom',
              sourceId: 'custom-table-alpha',
              reviewedForUse: true,
            },
          },
          notes: 'Snapshot note kept separate from body.',
        },
      },
    ],
    tags: ['session', 'oracle'],
    sessionLabel: 'Session 3',
    ...overrides,
  });

describe('CampaignWorkspacePersistenceService journal persistence', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('round-trips complete long journal entries with ordering, links, snapshots, and provenance', async () => {
    const storage = new MemoryStorage();
    const service = configure(storage);
    const entries = [
      journalFixture({ id: 'journal-newer', createdAt: '2026-07-06T00:00:00.000Z' }),
      journalFixture({
        id: 'journal-older',
        createdAt: '2026-07-01T00:00:00.000Z',
        title: 'Older entry',
      }),
    ];

    await expect(
      service.saveWorkspace(
        toPersistedCampaignWorkspace({
          progressTracks: [],
          journalEntries: entries,
          selectedJournalEntryId: 'journal-older',
        }),
      ),
    ).resolves.toEqual({ success: true });

    const saved = JSON.parse(storage.getItem(CAMPAIGN_WORKSPACE_STORAGE_KEY) ?? '{}') as {
      payload: { journalEntries: JournalEntry[]; selectedJournalEntryId?: string };
    };
    expect(saved.payload.journalEntries).toEqual(entries);
    expect(saved.payload.journalEntries[0]?.body).toBe(entries[0].body);
    expect(saved.payload.journalEntries[0]?.snapshots[0]?.roll).not.toHaveProperty('body');

    const loaded = await service.loadWorkspace();
    expect(loaded).toMatchObject({ success: true, found: true });
    if (loaded.success && loaded.found) {
      expect(loaded.workspace.journalEntries).toEqual(entries);
      expect(loaded.workspace.selectedJournalEntryId).toBe('journal-older');
      expect((loaded.workspace.journalEntries ?? []).map((entry) => entry.id)).toEqual([
        'journal-newer',
        'journal-older',
      ]);
    }
  });

  it('migrates older saves with neutral journal defaults and remains idempotent for current saves', () => {
    const legacy = migratePersistedCampaignWorkspace(
      createSaveEnvelope(
        {
          progressTracks: [],
          journalEntries: [
            {
              id: 'journal-legacy',
              createdAt,
              title: ' Legacy body spacing ',
              body: 'User text stays exact.  ',
            },
          ],
        },
        { appVersion: 'test', savedAt: createdAt, schemaVersion: 1 },
      ),
    );
    expect(legacy?.journalEntries?.[0]).toMatchObject({
      id: 'journal-legacy',
      body: 'User text stays exact.  ',
      links: {},
      sourceReferences: [],
      snapshots: [],
      tags: [],
      type: 'session_note',
    });

    const current = toPersistedCampaignWorkspace({
      progressTracks: [],
      journalEntries: [journalFixture()],
      selectedJournalEntryId: 'journal-alpha',
    });
    expect(
      migratePersistedCampaignWorkspace(
        createSaveEnvelope(current, { appVersion: 'test', savedAt: createdAt }),
      ),
    ).toEqual(current);
  });

  it('keeps valid journal siblings while dropping malformed optional records, links, and snapshots', () => {
    const valid = journalFixture({
      id: 'journal-valid',
      links: { oracleResultId: 'orphan-oracle' },
    });
    const withMalformedOptionalData = {
      ...journalFixture({ id: 'journal-sanitized' }),
      sourceReferences: [
        { id: 'roll-ok', type: 'roll', label: 'Valid orphan roll link' },
        { id: '', type: 'oracle', label: 'Broken source link' },
      ],
      snapshots: [{ type: 'oracle', roll: { id: 'not-enough' } }],
    };
    const migrated = migratePersistedCampaignWorkspace(
      createSaveEnvelope(
        {
          progressTracks: [],
          journalEntries: [
            valid,
            { id: '', title: 'broken', body: 'bad' },
            withMalformedOptionalData,
          ],
          selectedJournalEntryId: 'missing-selection',
        },
        { appVersion: 'test', savedAt: createdAt },
      ),
    );

    expect(migrated?.journalEntries?.map((entry) => entry.id)).toEqual([
      'journal-valid',
      'journal-sanitized',
    ]);
    expect(migrated?.journalEntries?.[0]?.links.oracleResultId).toBe('orphan-oracle');
    expect(migrated?.journalEntries?.[1]?.sourceReferences).toEqual([
      { id: 'roll-ok', type: 'roll', label: 'Valid orphan roll link' },
    ]);
    expect(migrated?.journalEntries?.[1]?.snapshots).toEqual([]);
    expect(migrated?.selectedJournalEntryId).toBeUndefined();
  });

  it('restores journal entries during startup without replacing them after a corrupt reload', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      CAMPAIGN_WORKSPACE_STORAGE_KEY,
      JSON.stringify(
        createSaveEnvelope(
          {
            progressTracks: [],
            journalEntries: [journalFixture({ id: 'journal-startup' })],
            selectedJournalEntryId: 'journal-startup',
          },
          { appVersion: 'test', savedAt: createdAt },
        ),
      ),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    });
    const workspace = TestBed.inject(CampaignWorkspaceService);

    await workspace.loadSavedWorkspace();

    expect(workspace.journalEntries().map((entry) => entry.id)).toEqual(['journal-startup']);
    expect(workspace.selectedJournalEntryId()).toBe('journal-startup');

    storage.setItem(
      CAMPAIGN_WORKSPACE_STORAGE_KEY,
      JSON.stringify(createSaveEnvelope([], { appVersion: 'test', savedAt: createdAt })),
    );
    await workspace.loadSavedWorkspace();

    expect(workspace.journalEntries().map((entry) => entry.id)).toEqual(['journal-startup']);
  });

  it('does not leak private journal text through malformed diagnostics', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      CAMPAIGN_WORKSPACE_STORAGE_KEY,
      JSON.stringify(
        createSaveEnvelope(
          {
            progressTracks: [],
            journalEntries: [{ id: 'private', title: 'Secret title', body: 42 }],
          },
          { appVersion: 'test', savedAt: createdAt },
        ),
      ),
    );
    const service = configure(storage);

    const result = await service.loadWorkspace();

    expect(result).toMatchObject({ success: true, found: true });
    if (result.success && result.found) expect(result.workspace.journalEntries).toEqual([]);
    expect(JSON.stringify(service.lastLoadError())).not.toContain('Secret title');
  });
});
