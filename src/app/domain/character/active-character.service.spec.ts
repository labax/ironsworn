import { TestBed } from '@angular/core/testing';

import { createMinimalCharacterFixture } from './character-fixtures';
import { ActiveCharacterService } from './active-character.service';

describe('ActiveCharacterService', () => {
  let service: ActiveCharacterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActiveCharacterService);
    service.clearActiveCharacter();
  });

  it('starts with an empty active character state', () => {
    expect(service.activeCharacter()).toBeNull();
    expect(service.activeCharacterSummary()).toBeNull();
    expect(service.hasActiveCharacter()).toBe(false);
  });

  it('sets and reads the active character', () => {
    const character = createMinimalCharacterFixture();

    service.setActiveCharacter(character);

    expect(service.activeCharacter()).toMatchObject({
      name: 'Kara',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: { current: 2 },
    });
    expect(service.activeCharacterSummary()).toEqual({
      name: 'Kara',
      concept: 'Wandering scout',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: 2,
    });
  });

  it('patches the current active character without replacing nested values', () => {
    service.setActiveCharacter(createMinimalCharacterFixture());

    const updated = service.updateActiveCharacter({
      name: 'Vale',
      stats: { edge: 2 },
      statusTracks: { health: 4 },
      momentum: { current: 3 },
      experience: { earned: 4 },
    });

    expect(updated).toMatchObject({
      name: 'Vale',
      stats: { edge: 2, heart: 2, iron: 2, shadow: 1, wits: 1 },
      statusTracks: { health: 4, spirit: 5, supply: 5 },
      momentum: { current: 3, max: 10, reset: 2 },
      experience: { earned: 4, spent: 0 },
    });
    expect(service.activeCharacter()?.name).toBe('Vale');
  });

  it('patches bond collections without replacing unrelated character fields', () => {
    service.setActiveCharacter(
      createMinimalCharacterFixture({
        bonds: [{ id: 'bond-1', name: 'Brynn', description: 'Ally' }],
      }),
    );

    const updated = service.updateActiveCharacter({
      bonds: [
        { id: 'bond-1', name: 'Brynn', description: 'Ally' },
        { id: 'bond-2', name: 'Talan' },
      ],
    });

    expect(updated).toMatchObject({
      id: 'character-fixture-1',
      name: 'Kara',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      bonds: [
        { id: 'bond-1', name: 'Brynn', description: 'Ally' },
        { id: 'bond-2', name: 'Talan' },
      ],
    });
  });

  it('patches equipment and character notes without replacing unrelated fields', () => {
    service.setActiveCharacter(createMinimalCharacterFixture({ id: 'note-id', notes: 'Old note' }));

    const updated = service.updateActiveCharacter({
      equipmentNotes: 'Rope\nTorch; cloak',
      notes: 'Idea: stay wary.',
    });

    expect(updated).toMatchObject({
      id: 'note-id',
      name: 'Kara',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      equipmentNotes: 'Rope\nTorch; cloak',
      notes: 'Idea: stay wary.',
    });
  });

  it('returns null when patching an empty active character state', () => {
    expect(service.updateActiveCharacter({ name: 'No one' })).toBeNull();
    expect(service.activeCharacter()).toBeNull();
  });
});
