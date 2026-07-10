import { TestBed } from '@angular/core/testing';

import { BROWSER_STORAGE, createSaveEnvelope, type BrowserStorageLike } from '@app/core/storage';
import { CURRENT_SAVE_SCHEMA_VERSION } from '@app/core/storage/storage.types';

import { createMinimalCharacterFixture } from './character-fixtures';
import {
  ACTIVE_CHARACTER_STORAGE_KEY,
  ActiveCharacterPersistenceService,
  type PersistedActiveCharacter,
} from './active-character-persistence.service';

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

class FailingStorage extends MemoryStorage {
  override setItem(): void {
    throw new Error('Storage disabled for test');
  }
}

const configureService = (
  storage: BrowserStorageLike | null,
): ActiveCharacterPersistenceService => {
  TestBed.configureTestingModule({
    providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
  });

  return TestBed.inject(ActiveCharacterPersistenceService);
};

describe('ActiveCharacterPersistenceService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('saves the active minimal character values in a versioned envelope', async () => {
    const storage = new MemoryStorage();
    const service = configureService(storage);

    const result = await service.saveActiveCharacter(createMinimalCharacterFixture());

    expect(result).toEqual({ success: true });
    expect(service.saveStatus()).toBe('saved');

    const rawValue = storage.getItem(ACTIVE_CHARACTER_STORAGE_KEY);
    expect(rawValue).not.toBeNull();
    const saved = JSON.parse(rawValue ?? '{}') as {
      schemaVersion: number;
      metadata: Record<string, unknown>;
      payload: PersistedActiveCharacter;
    };

    expect(saved.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(saved.metadata).toMatchObject({
      namespace: ACTIVE_CHARACTER_STORAGE_KEY,
      contentType: 'active-character',
    });
    expect(saved.payload).toMatchObject({
      id: 'character-fixture-1',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-01-02T03:04:05.000Z',
      name: 'Kara',
      concept: 'Wandering scout',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: { current: 2, max: 10, reset: 2, hasOverride: false },
      bonds: [],
    });
  });

  it('loads a valid saved minimal character from storage', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      ACTIVE_CHARACTER_STORAGE_KEY,
      JSON.stringify(
        createSaveEnvelope<PersistedActiveCharacter>(
          {
            name: 'Vale',
            concept: 'Storm watcher',
            stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
            statusTracks: { health: 4, spirit: 3, supply: 2 },
            momentum: 4,
          },
          { appVersion: 'test', savedAt: '2026-02-03T04:05:06.000Z' },
        ),
      ),
    );
    const service = configureService(storage);

    const result = await service.loadActiveCharacter();

    expect(result).toMatchObject({
      success: true,
      found: true,
      character: {
        name: 'Vale',
        concept: 'Storm watcher',
        stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
        statusTracks: { health: 4, spirit: 3, supply: 2 },
        momentum: { current: 4 },
      },
    });
  });

  it('saves and loads bond records with stable IDs, notes, and order', async () => {
    const storage = new MemoryStorage();
    const service = configureService(storage);
    const character = createMinimalCharacterFixture({
      bonds: [
        {
          id: 'bond-1',
          name: 'Brynn',
          description: 'First\nline',
          progressTrackId: 'future-track',
        },
        { id: 'bond-2', name: 'Talan' },
      ],
    });

    await service.saveActiveCharacter(character);
    const saved = JSON.parse(storage.getItem(ACTIVE_CHARACTER_STORAGE_KEY) ?? '{}') as {
      payload: PersistedActiveCharacter;
    };
    expect(saved.payload.bonds).toEqual(character.bonds);

    const loaded = await service.loadActiveCharacter();

    expect(loaded).toMatchObject({
      success: true,
      found: true,
      character: {
        bonds: [
          {
            id: 'bond-1',
            name: 'Brynn',
            description: 'First\nline',
            progressTrackId: 'future-track',
          },
          { id: 'bond-2', name: 'Talan' },
        ],
      },
    });
  });

  it('loads saved override values and preserved identity metadata', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      ACTIVE_CHARACTER_STORAGE_KEY,
      JSON.stringify(
        createSaveEnvelope<PersistedActiveCharacter>(
          {
            id: 'character-override',
            createdAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-02T00:00:00.000Z',
            name: 'Vale',
            stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
            statusTracks: { health: 6, spirit: 3, supply: 2 },
            momentum: 4,
          },
          { appVersion: 'test', savedAt: '2026-02-03T04:05:06.000Z' },
        ),
      ),
    );
    const service = configureService(storage);

    const result = await service.loadActiveCharacter();

    expect(result).toMatchObject({
      success: true,
      found: true,
      character: {
        id: 'character-override',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-02T00:00:00.000Z',
        statusTracks: { health: 6, spirit: 3, supply: 2 },
      },
    });
  });

  it('reports an empty load when no saved character exists', async () => {
    const service = configureService(new MemoryStorage());

    await expect(service.loadActiveCharacter()).resolves.toEqual({ success: true, found: false });
  });

  it('reports malformed saved character payloads without throwing', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      ACTIVE_CHARACTER_STORAGE_KEY,
      JSON.stringify(
        createSaveEnvelope(
          {
            name: '',
            stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
            statusTracks: { health: 4, spirit: 3, supply: 2 },
            momentum: 4,
          },
          { appVersion: 'test' },
        ),
      ),
    );
    const service = configureService(storage);

    const result = await service.loadActiveCharacter();

    expect(result).toMatchObject({
      success: false,
      error: { code: 'malformed-data' },
    });
  });

  it('overwrites a previously saved character with updated minimal values', async () => {
    const storage = new MemoryStorage();
    const service = configureService(storage);

    await service.saveActiveCharacter(createMinimalCharacterFixture());
    await service.saveActiveCharacter(
      createMinimalCharacterFixture({
        name: 'Vale',
        concept: undefined,
        stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
        statusTracks: { health: 4, spirit: 3, supply: 2 },
        momentum: { current: 4, max: 10, reset: 2, hasOverride: false },
      }),
    );

    const saved = JSON.parse(storage.getItem(ACTIVE_CHARACTER_STORAGE_KEY) ?? '{}') as {
      payload: PersistedActiveCharacter;
    };

    expect(saved.payload).toMatchObject({
      id: 'character-fixture-1',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-01-02T03:04:05.000Z',
      name: 'Vale',
      stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
      statusTracks: { health: 4, spirit: 3, supply: 2 },
      momentum: { current: 4, max: 10, reset: 2, hasOverride: false },
    });
  });

  it('reports save failure without throwing or clearing the current save result', async () => {
    const service = configureService(new FailingStorage());

    const result = await service.saveActiveCharacter(createMinimalCharacterFixture());

    expect(result.success).toBe(false);
    expect(service.saveStatus()).toBe('failed');
    expect(service.lastSaveResult()).toBe(result);
  });
});
