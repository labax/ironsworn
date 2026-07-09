import { computed, Injectable, signal } from '@angular/core';

import type { Character } from './character';

export type ActiveCharacter = Pick<
  Character,
  'name' | 'concept' | 'stats' | 'statusTracks' | 'momentum'
>;

export type ActiveCharacterPatch = Partial<
  Omit<ActiveCharacter, 'stats' | 'statusTracks' | 'momentum'>
> & {
  readonly stats?: Partial<Character['stats']>;
  readonly statusTracks?: Partial<Character['statusTracks']>;
  readonly momentum?: Partial<Character['momentum']>;
};

export interface ActiveCharacterSummary {
  readonly name: string;
  readonly concept?: string;
  readonly stats: Character['stats'];
  readonly statusTracks: Character['statusTracks'];
  readonly momentum: number;
}

const cloneActiveCharacter = (character: Character): Character => ({
  ...character,
  stats: { ...character.stats },
  statusTracks: { ...character.statusTracks },
  momentum: { ...character.momentum },
  debilities: [...character.debilities],
  bonds: [...character.bonds],
  assets: [...character.assets],
  experience: { ...character.experience },
});

@Injectable({ providedIn: 'root' })
export class ActiveCharacterService {
  private readonly activeCharacterState = signal<Character | null>(null);

  readonly activeCharacter = this.activeCharacterState.asReadonly();
  readonly hasActiveCharacter = computed(() => this.activeCharacterState() !== null);
  readonly activeCharacterSummary = computed<ActiveCharacterSummary | null>(() => {
    const character = this.activeCharacterState();

    if (!character) {
      return null;
    }

    return {
      name: character.name,
      concept: character.concept,
      stats: character.stats,
      statusTracks: character.statusTracks,
      momentum: character.momentum.current,
    };
  });

  setActiveCharacter(character: Character): void {
    this.activeCharacterState.set(cloneActiveCharacter(character));
  }

  updateActiveCharacter(patch: ActiveCharacterPatch): Character | null {
    const current = this.activeCharacterState();

    if (!current) {
      return null;
    }

    const updated: Character = {
      ...current,
      ...patch,
      stats: {
        ...current.stats,
        ...patch.stats,
      },
      statusTracks: {
        ...current.statusTracks,
        ...patch.statusTracks,
      },
      momentum: {
        ...current.momentum,
        ...patch.momentum,
      },
      updatedAt: new Date().toISOString(),
    };

    this.activeCharacterState.set(updated);
    return updated;
  }

  clearActiveCharacter(): void {
    this.activeCharacterState.set(null);
  }
}
