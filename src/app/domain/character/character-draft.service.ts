import { Injectable, inject } from '@angular/core';

import {
  createDefaultCharacter,
  type Character,
  type StatKey,
  type StatusTracks,
} from './character';
import { ActiveCharacterService } from './active-character.service';
import {
  ActiveCharacterPersistenceService,
  type ActiveCharacterLoadResult,
} from './active-character-persistence.service';

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
  private readonly activeCharacterState = inject(ActiveCharacterService);
  private readonly activeCharacterPersistence = inject(ActiveCharacterPersistenceService);

  readonly character = this.activeCharacterState.activeCharacter;
  readonly saveStatus = this.activeCharacterPersistence.saveStatus;
  readonly lastSaveResult = this.activeCharacterPersistence.lastSaveResult;

  async loadSavedCharacter(): Promise<ActiveCharacterLoadResult> {
    if (this.activeCharacterState.hasActiveCharacter()) {
      return {
        success: true,
        found: true,
        character: this.activeCharacterState.activeCharacter()!,
      };
    }

    const result = await this.activeCharacterPersistence.loadActiveCharacter();

    if (result.success && result.found) {
      this.activeCharacterState.setActiveCharacter(result.character);
    }

    return result;
  }

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

    this.activeCharacterState.setActiveCharacter(character);
    void this.activeCharacterPersistence.saveActiveCharacter(character);
    return character;
  }

  clear(): void {
    this.activeCharacterState.clearActiveCharacter();
  }
}
