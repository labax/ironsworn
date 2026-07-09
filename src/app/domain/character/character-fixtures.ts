import { createDefaultCharacter, type Character } from './character';

export const createMinimalCharacterFixture = (overrides: Partial<Character> = {}): Character => {
  const baseCharacter = createDefaultCharacter({
    id: 'character-fixture-1',
    createdAt: '2026-01-02T03:04:05.000Z',
    name: 'Kara',
    concept: 'Wandering scout',
  });

  return {
    ...baseCharacter,
    stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
    statusTracks: { health: 5, spirit: 5, supply: 5 },
    momentum: { ...baseCharacter.momentum, current: 2 },
    ...overrides,
  };
};
