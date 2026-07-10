import { Injectable, inject, signal } from '@angular/core';
import {
  LocalStorageAdapter,
  createSaveEnvelope,
  type LoadResult,
  type SaveResult,
  type StorageError,
} from '@app/core/storage';
import { environment } from '@environments/environment';

import {
  createDefaultCharacter,
  isValidStats,
  type Bond,
  type Character,
  type CharacterDebility,
  type MomentumState,
  type Stats,
  type StatusTracks,
} from './character';

export const ACTIVE_CHARACTER_STORAGE_KEY = 'ironsworn.activeCharacter';

export type ActiveCharacterSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface PersistedActiveCharacter {
  readonly id?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly name: string;
  readonly concept?: string;
  readonly stats: Stats;
  readonly statusTracks: StatusTracks;
  readonly momentum: number | MomentumState;
  readonly debilities?: readonly CharacterDebility[];
  readonly bonds?: readonly Bond[];
}

export type ActiveCharacterLoadResult =
  | { readonly success: true; readonly found: true; readonly character: Character }
  | { readonly success: true; readonly found: false }
  | { readonly success: false; readonly error: StorageError };

export const toPersistedActiveCharacter = (character: Character): PersistedActiveCharacter => ({
  id: character.id,
  createdAt: character.createdAt,
  updatedAt: character.updatedAt,
  name: character.name,
  concept: character.concept,
  stats: { ...character.stats },
  statusTracks: { ...character.statusTracks },
  momentum: { ...character.momentum },
  debilities: character.debilities.map((debility) => ({ ...debility })),
  bonds: character.bonds.map((bond) => ({ ...bond })),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasValidMomentumNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= -6 && value <= 10;

const hasValidMomentumState = (value: unknown): value is MomentumState => {
  if (!isRecord(value)) return false;

  const current = value['current'];
  const max = value['max'];
  const reset = value['reset'];
  const hasOverride = value['hasOverride'];

  return (
    Number.isInteger(current) &&
    Number.isInteger(max) &&
    Number.isInteger(reset) &&
    typeof hasOverride === 'boolean' &&
    (hasOverride ||
      ((current as number) >= -6 &&
        (current as number) <= (max as number) &&
        (max as number) >= (reset as number)))
  );
};

const hasValidMomentum = (value: unknown): value is PersistedActiveCharacter['momentum'] =>
  hasValidMomentumNumber(value) || hasValidMomentumState(value);

const isPersistedStats = (value: unknown): value is Stats =>
  isRecord(value) &&
  ['edge', 'heart', 'iron', 'shadow', 'wits'].every((key) => typeof value[key] === 'number') &&
  isValidStats(value as unknown as Stats);

const hasPersistableStatusTrackValues = (tracks: StatusTracks): boolean =>
  [tracks.health, tracks.spirit, tracks.supply].every(
    (value) => Number.isInteger(value) && value >= 0,
  );

const isPersistedStatusTracks = (value: unknown): value is StatusTracks =>
  isRecord(value) &&
  ['health', 'spirit', 'supply'].every((key) => typeof value[key] === 'number') &&
  hasPersistableStatusTrackValues(value as unknown as StatusTracks);

const isPersistedBond = (value: unknown): value is Bond => {
  if (!isRecord(value)) return false;

  const description = value['description'];
  const progressTrackId = value['progressTrackId'];

  return (
    typeof value['id'] === 'string' &&
    value['id'].trim().length > 0 &&
    typeof value['name'] === 'string' &&
    value['name'].trim().length > 0 &&
    (description === undefined || typeof description === 'string') &&
    (progressTrackId === undefined || typeof progressTrackId === 'string')
  );
};

const isPersistedDebility = (value: unknown): value is CharacterDebility => {
  if (!isRecord(value)) return false;

  const category = value['category'];
  const type = value['type'];
  const notes = value['notes'];

  return (
    typeof value['id'] === 'string' &&
    ['condition', 'bane', 'burden'].includes(category as string) &&
    [
      'wounded',
      'shaken',
      'unprepared',
      'maimed',
      'corrupted',
      'cursed',
      'tormented',
      'custom',
    ].includes(type as string) &&
    typeof value['label'] === 'string' &&
    value['label'].trim().length > 0 &&
    (notes === undefined || typeof notes === 'string')
  );
};

const isPersistedDebilities = (value: unknown): value is readonly CharacterDebility[] =>
  value === undefined || (Array.isArray(value) && value.every(isPersistedDebility));

const isPersistedBonds = (value: unknown): value is readonly Bond[] =>
  value === undefined || (Array.isArray(value) && value.every(isPersistedBond));

const isPersistedActiveCharacter = (value: unknown): value is PersistedActiveCharacter => {
  if (!isRecord(value)) return false;

  const concept = value['concept'];
  return (
    typeof value['name'] === 'string' &&
    value['name'].trim().length > 0 &&
    (concept === undefined || typeof concept === 'string') &&
    isPersistedStats(value['stats']) &&
    isPersistedStatusTracks(value['statusTracks']) &&
    hasValidMomentum(value['momentum']) &&
    isPersistedDebilities(value['debilities']) &&
    isPersistedBonds(value['bonds'])
  );
};

const createRestoredCharacterId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `restored-character-${Date.now()}`;

const toCharacter = (persisted: PersistedActiveCharacter, savedAt: string): Character => {
  const baseCharacter = createDefaultCharacter({
    id: persisted.id ?? createRestoredCharacterId(),
    createdAt: persisted.createdAt ?? savedAt,
    updatedAt: persisted.updatedAt ?? savedAt,
    name: persisted.name.trim(),
    concept: persisted.concept?.trim() || undefined,
  });

  return {
    ...baseCharacter,
    stats: { ...persisted.stats },
    statusTracks: { ...persisted.statusTracks },
    momentum:
      typeof persisted.momentum === 'number'
        ? { ...baseCharacter.momentum, current: persisted.momentum }
        : { ...persisted.momentum },
    debilities:
      persisted.debilities?.map((debility) => ({
        ...debility,
        label: debility.label.trim(),
        notes: debility.notes?.trim() || undefined,
      })) ?? [],
    bonds:
      persisted.bonds?.map((bond) => ({
        ...bond,
        name: bond.name.trim(),
        description: bond.description?.trim() || undefined,
      })) ?? [],
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
    const result: LoadResult<PersistedActiveCharacter> = await this.storage.load(
      ACTIVE_CHARACTER_STORAGE_KEY,
    );

    if (!result.success || !result.found) {
      return result;
    }

    if (!isPersistedActiveCharacter(result.data.payload)) {
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
      character: toCharacter(result.data.payload, result.data.savedAt),
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
