import { Injectable, inject } from '@angular/core';

import {
  createDefaultCharacter,
  type Bond,
  type Character,
  type CharacterDebility,
  type StatKey,
  type Stats,
  type MomentumState,
  type StatusTracks,
} from './character';
import { ActiveCharacterService } from './active-character.service';
import {
  ActiveCharacterPersistenceService,
  type ActiveCharacterLoadResult,
} from './active-character-persistence.service';

export type StatusTrackKey = keyof StatusTracks;

export interface CharacterIdentityStatsInput {
  readonly name: string;
  readonly concept?: string;
  readonly stats: Stats;
}

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

const createEntityId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createCharacterId = (): string => createEntityId('character');
const createBondId = (): string => createEntityId('bond');

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

  updateMomentum(momentum: MomentumState): Character | null {
    const updated = this.activeCharacterState.updateActiveCharacter({ momentum });

    if (updated) {
      void this.activeCharacterPersistence.saveActiveCharacter(updated);
    }

    return updated;
  }

  updateDebilitiesAndMomentum(
    debilities: readonly CharacterDebility[],
    momentum: MomentumState,
  ): Character | null {
    const updated = this.activeCharacterState.updateActiveCharacter({ debilities, momentum });

    if (updated) {
      void this.activeCharacterPersistence.saveActiveCharacter(updated);
    }

    return updated;
  }

  updateStatusTrack(key: StatusTrackKey, value: number): Character | null {
    const updated = this.activeCharacterState.updateActiveCharacter({
      statusTracks: { [key]: value },
    });

    if (updated) {
      void this.activeCharacterPersistence.saveActiveCharacter(updated);
    }

    return updated;
  }

  updateIdentityAndStats(input: CharacterIdentityStatsInput): Character | null {
    const updated = this.activeCharacterState.updateActiveCharacter({
      name: input.name.trim(),
      concept: input.concept?.trim() || undefined,
      stats: input.stats,
    });

    if (updated) {
      void this.activeCharacterPersistence.saveActiveCharacter(updated);
    }

    return updated;
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

  addBond(input: { readonly name: string; readonly description?: string }): Character | null {
    const character = this.activeCharacterState.activeCharacter();
    if (!character) return null;

    const bond: Bond = {
      id: createBondId(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
    };

    const updated = this.activeCharacterState.updateActiveCharacter({
      bonds: [...character.bonds, bond],
    });

    if (updated) {
      void this.activeCharacterPersistence.saveActiveCharacter(updated);
    }

    return updated;
  }

  updateBond(input: Bond): Character | null {
    const character = this.activeCharacterState.activeCharacter();
    if (!character) return null;

    const updatedBonds = character.bonds.map((bond) =>
      bond.id === input.id
        ? {
            ...bond,
            name: input.name.trim(),
            description: input.description?.trim() || undefined,
            progressTrackId: input.progressTrackId,
          }
        : bond,
    );

    const updated = this.activeCharacterState.updateActiveCharacter({ bonds: updatedBonds });

    if (updated) {
      void this.activeCharacterPersistence.saveActiveCharacter(updated);
    }

    return updated;
  }

  removeBond(id: string): Character | null {
    const character = this.activeCharacterState.activeCharacter();
    if (!character) return null;

    const updated = this.activeCharacterState.updateActiveCharacter({
      bonds: character.bonds.filter((bond) => bond.id !== id),
    });

    if (updated) {
      void this.activeCharacterPersistence.saveActiveCharacter(updated);
    }

    return updated;
  }

  clear(): void {
    this.activeCharacterState.clearActiveCharacter();
  }
}
