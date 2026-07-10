import { Injectable, inject, signal } from '@angular/core';
import {
  LocalStorageAdapter,
  createSaveEnvelope,
  type LoadResult,
  type SaveResult,
  type StorageError,
} from '@app/core/storage';
import { environment } from '@environments/environment';

import { createDefaultCharacter, type Character } from './character';
import {
  migratePersistedActiveCharacter,
  type PersistedActiveCharacter,
} from './active-character-persistence.migrations';

export { type PersistedActiveCharacter } from './active-character-persistence.migrations';

export const ACTIVE_CHARACTER_STORAGE_KEY = 'ironsworn.activeCharacter';

export type ActiveCharacterSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export type ActiveCharacterLoadResult =
  | { readonly success: true; readonly found: true; readonly character: Character }
  | { readonly success: true; readonly found: false }
  | { readonly success: false; readonly error: StorageError };

export const toPersistedActiveCharacter = (character: Character): PersistedActiveCharacter => ({
  id: character.id,
  createdAt: character.createdAt,
  updatedAt: character.updatedAt,
  name: character.name,
  pronouns: character.pronouns,
  concept: character.concept,
  campaignId: character.campaignId,
  stats: { ...character.stats },
  statusTracks: { ...character.statusTracks },
  momentum: { ...character.momentum },
  debilities: character.debilities.map((debility) => ({ ...debility })),
  bonds: character.bonds.map((bond) => ({ ...bond })),
  assets: character.assets.map((asset) => ({
    ...asset,
    provenance: asset.provenance ?? 'user_authored',
  })),
  equipmentNotes: character.equipmentNotes,
  notes: character.notes,
  experience: { ...character.experience },
});

const createRestoredCharacterId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `restored-character-${Date.now()}`;

const toCharacter = (persisted: PersistedActiveCharacter, savedAt: string): Character => {
  const baseCharacter = createDefaultCharacter({
    id: persisted.id ?? createRestoredCharacterId(),
    createdAt: persisted.createdAt ?? savedAt,
    updatedAt: persisted.updatedAt ?? savedAt,
    name: persisted.name,
    pronouns: persisted.pronouns,
    concept: persisted.concept,
    campaignId: persisted.campaignId,
  });

  return {
    ...baseCharacter,
    stats: { ...persisted.stats },
    statusTracks: { ...persisted.statusTracks },
    momentum:
      typeof persisted.momentum === 'number'
        ? { ...baseCharacter.momentum, current: persisted.momentum }
        : { ...persisted.momentum },
    debilities: persisted.debilities?.map((debility) => ({ ...debility })) ?? [],
    bonds: persisted.bonds?.map((bond) => ({ ...bond })) ?? [],
    assets: persisted.assets?.map((asset) => ({ ...asset })) ?? [],
    equipmentNotes: persisted.equipmentNotes ?? '',
    notes: persisted.notes ?? '',
    experience: persisted.experience ? { ...persisted.experience } : baseCharacter.experience,
  };
};

@Injectable({ providedIn: 'root' })
export class ActiveCharacterPersistenceService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly saveStatusState = signal<ActiveCharacterSaveStatus>('idle');
  private readonly lastSaveResultState = signal<SaveResult | null>(null);

  readonly saveStatus = this.saveStatusState.asReadonly();
  readonly lastSaveResult = this.lastSaveResultState.asReadonly();

  async loadActiveCharacter(): Promise<ActiveCharacterLoadResult> {
    const result: LoadResult<unknown> = await this.storage.load(ACTIVE_CHARACTER_STORAGE_KEY);

    if (!result.success || !result.found) {
      return result;
    }

    const persisted = migratePersistedActiveCharacter(result.data);
    if (!persisted) {
      return {
        success: false,
        error: {
          code: 'malformed-data',
          message: 'Saved character data is incomplete or outside supported ranges.',
        },
      };
    }

    return {
      success: true,
      found: true,
      character: toCharacter(persisted, result.data.savedAt),
    };
  }

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
