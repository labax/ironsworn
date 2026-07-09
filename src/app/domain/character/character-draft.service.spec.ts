import { TestBed } from '@angular/core/testing';

import { BROWSER_STORAGE, createSaveEnvelope, type BrowserStorageLike } from '@app/core/storage';

import {
  ACTIVE_CHARACTER_STORAGE_KEY,
  type PersistedActiveCharacter,
} from './active-character-persistence.service';
import { ActiveCharacterService } from './active-character.service';
import { createMinimalCharacterFixture } from './character-fixtures';
import { CharacterDraftService } from './character-draft.service';

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

const configureService = (storage: MemoryStorage): CharacterDraftService => {
  TestBed.configureTestingModule({
    providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
  });

  return TestBed.inject(CharacterDraftService);
};

describe('CharacterDraftService saved character loading', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('restores a valid saved character into active character state', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      ACTIVE_CHARACTER_STORAGE_KEY,
      JSON.stringify(
        createSaveEnvelope<PersistedActiveCharacter>(
          {
            name: 'Vale',
            stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
            statusTracks: { health: 4, spirit: 3, supply: 2 },
            momentum: 4,
          },
          { appVersion: 'test' },
        ),
      ),
    );
    const service = configureService(storage);

    const result = await service.loadSavedCharacter();

    expect(result).toMatchObject({ success: true, found: true });
    expect(service.character()).toMatchObject({
      name: 'Vale',
      stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
      statusTracks: { health: 4, spirit: 3, supply: 2 },
      momentum: { current: 4 },
    });
  });

  it('leaves active character state empty when no saved character exists', async () => {
    const service = configureService(new MemoryStorage());

    await expect(service.loadSavedCharacter()).resolves.toEqual({ success: true, found: false });
    expect(service.character()).toBeNull();
  });

  it('does not overwrite an existing active character when saved data is malformed', async () => {
    const storage = new MemoryStorage();
    storage.setItem(ACTIVE_CHARACTER_STORAGE_KEY, '{not-json');
    const service = configureService(storage);
    const activeCharacter = TestBed.inject(ActiveCharacterService);

    activeCharacter.setActiveCharacter(createMinimalCharacterFixture());

    const result = await service.loadSavedCharacter();

    expect(result).toMatchObject({ success: true, found: true });
    expect(service.character()).toMatchObject({
      name: 'Kara',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: { current: 2 },
    });
  });
});
