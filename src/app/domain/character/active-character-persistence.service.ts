import { Injectable, inject, signal } from '@angular/core';
import { LocalStorageAdapter, createSaveEnvelope, type SaveResult } from '@app/core/storage';
import { environment } from '@environments/environment';

import type { Character, Stats, StatusTracks } from './character';

export const ACTIVE_CHARACTER_STORAGE_KEY = 'ironsworn.activeCharacter';

export type ActiveCharacterSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface PersistedActiveCharacter {
  readonly name: string;
  readonly concept?: string;
  readonly stats: Stats;
  readonly statusTracks: StatusTracks;
  readonly momentum: number;
}

export const toPersistedActiveCharacter = (character: Character): PersistedActiveCharacter => ({
  name: character.name,
  concept: character.concept,
  stats: { ...character.stats },
  statusTracks: { ...character.statusTracks },
  momentum: character.momentum.current,
});

@Injectable({ providedIn: 'root' })
export class ActiveCharacterPersistenceService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly saveStatusState = signal<ActiveCharacterSaveStatus>('idle');
  private readonly lastSaveResultState = signal<SaveResult | null>(null);

  readonly saveStatus = this.saveStatusState.asReadonly();
  readonly lastSaveResult = this.lastSaveResultState.asReadonly();

  async saveActiveCharacter(character: Character): Promise<SaveResult> {
    this.saveStatusState.set('saving');

    const result = await this.storage.save(
      ACTIVE_CHARACTER_STORAGE_KEY,
      createSaveEnvelope(toPersistedActiveCharacter(character), {
        appVersion: environment.appVersion,
        metadata: { namespace: ACTIVE_CHARACTER_STORAGE_KEY, contentType: 'active-character' },
      }),
    );

    this.lastSaveResultState.set(result);
    this.saveStatusState.set(result.success ? 'saved' : 'failed');
    return result;
  }
}
