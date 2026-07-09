import { TestBed } from '@angular/core/testing';

import { BROWSER_STORAGE, type BrowserStorageLike } from '@app/core/storage';
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
    expect(saved.payload).toEqual({
      name: 'Kara',
      concept: 'Wandering scout',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: 2,
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

    expect(saved.payload).toEqual({
      name: 'Vale',
      stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
      statusTracks: { health: 4, spirit: 3, supply: 2 },
      momentum: 4,
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
