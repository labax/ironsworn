import { Injectable, signal } from '@angular/core';

import {
  createDefaultCharacter,
  type Character,
  type StatKey,
  type StatusTracks,
} from './character';

export interface CharacterCreationInput {
  readonly name: string;
  readonly concept?: string;
  readonly edge: number;
  readonly heart: number;
  readonly iron: number;
  readonly shadow: number;
  readonly wits: number;
  readonly health: number;
  readonly spirit: number;
  readonly supply: number;
  readonly momentum: number;
}

const statKeys: readonly StatKey[] = ['edge', 'heart', 'iron', 'shadow', 'wits'];

const buildStats = (input: CharacterCreationInput): Character['stats'] =>
  statKeys.reduce(
    (stats, key) => ({
      ...stats,
      [key]: input[key],
    }),
    {} as Character['stats'],
  );

const buildStatusTracks = (input: CharacterCreationInput): StatusTracks => ({
  health: input.health,
  spirit: input.spirit,
  supply: input.supply,
});

const createCharacterId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `character-${Date.now()}`;

@Injectable({ providedIn: 'root' })
export class CharacterDraftService {
  readonly character = signal<Character | null>(null);

  save(input: CharacterCreationInput): Character {
    const baseCharacter = createDefaultCharacter({
      id: createCharacterId(),
      createdAt: new Date().toISOString(),
      name: input.name,
      concept: input.concept || undefined,
    });

    const character: Character = {
      ...baseCharacter,
      stats: buildStats(input),
      statusTracks: buildStatusTracks(input),
      momentum: {
        ...baseCharacter.momentum,
        current: input.momentum,
      },
    };

    this.character.set(character);
    return character;
  }

  clear(): void {
    this.character.set(null);
  }
}
