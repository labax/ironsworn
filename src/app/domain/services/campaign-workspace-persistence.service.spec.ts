import { TestBed } from '@angular/core/testing';

import { BROWSER_STORAGE, createSaveEnvelope, type BrowserStorageLike } from '@app/core/storage';
import { CURRENT_SAVE_SCHEMA_VERSION } from '@app/core/storage/storage.types';
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
