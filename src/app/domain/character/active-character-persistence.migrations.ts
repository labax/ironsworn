import { CURRENT_SAVE_SCHEMA_VERSION, type VersionedSaveEnvelope } from '@app/core/storage';

import {
  createDefaultMomentumState,
  type AssetReference,
  type Bond,
  type CharacterDebility,
  type CharacterExperience,
  type MomentumState,
  type Stats,
  type StatusTracks,
} from './character';

// Schema v1 is the minimal active-character slice from CS-02/CS-04 plus the #35/#36
// startup persistence path: identity, concept, stats, status tracks, and numeric Momentum.
export const MINIMAL_CHARACTER_SAVE_SCHEMA_VERSION = 1;

// Schema v2 persists the complete CS-02 through CS-09 Character model. Missing v1 fields
// migrate to project-neutral defaults: empty collections/text and zero earned/spent XP.
export const COMPLETE_CHARACTER_SAVE_SCHEMA_VERSION = CURRENT_SAVE_SCHEMA_VERSION;

export interface PersistedActiveCharacter {
  readonly id?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly name: string;
  readonly pronouns?: string;
  readonly concept?: string;
  readonly campaignId?: string;
  readonly stats: Stats;
  readonly statusTracks: StatusTracks;
  readonly momentum: MomentumState | number;
  readonly debilities?: readonly CharacterDebility[];
  readonly bonds?: readonly Bond[];
  readonly assets?: readonly AssetReference[];
  readonly equipmentNotes?: string;
  readonly notes?: string;
  readonly experience?: CharacterExperience;
}

export interface LegacyPersistedActiveCharacter {
  readonly id?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly name: string;
  readonly pronouns?: string;
  readonly concept?: string;
  readonly campaignId?: string;
  readonly stats: Stats;
  readonly statusTracks: StatusTracks;
  readonly momentum: number | MomentumState;
  readonly debilities?: unknown;
  readonly bonds?: unknown;
  readonly assets?: unknown;
  readonly equipmentNotes?: unknown;
  readonly notes?: unknown;
  readonly experience?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === 'string';

const isStats = (value: unknown): value is Stats =>
  isRecord(value) &&
  ['edge', 'heart', 'iron', 'shadow', 'wits'].every(
    (key) => Number.isInteger(value[key]) && (value[key] as number) >= 0,
  );

const isStatusTracks = (value: unknown): value is StatusTracks =>
  isRecord(value) &&
  ['health', 'spirit', 'supply'].every(
    (key) => Number.isInteger(value[key]) && (value[key] as number) >= 0,
  );

const isMomentumNumber = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= -6 && (value as number) <= 10;

const isMomentumState = (value: unknown): value is MomentumState =>
  isRecord(value) &&
  Number.isInteger(value['current']) &&
  Number.isInteger(value['max']) &&
  Number.isInteger(value['reset']) &&
  typeof value['hasOverride'] === 'boolean' &&
  (value['hasOverride'] ||
    ((value['current'] as number) >= -6 &&
      (value['current'] as number) <= (value['max'] as number) &&
      (value['max'] as number) >= (value['reset'] as number)));

const isDebility = (value: unknown): value is CharacterDebility =>
  isRecord(value) &&
  isNonEmptyString(value['id']) &&
  ['condition', 'bane', 'burden'].includes(value['category'] as string) &&
  [
    'wounded',
    'shaken',
    'unprepared',
    'maimed',
    'corrupted',
    'cursed',
    'tormented',
    'custom',
  ].includes(value['type'] as string) &&
  isNonEmptyString(value['label']) &&
  isOptionalString(value['notes']);

const isBond = (value: unknown): value is Bond =>
  isRecord(value) &&
  isNonEmptyString(value['id']) &&
  isNonEmptyString(value['name']) &&
  isOptionalString(value['description']) &&
  isOptionalString(value['progressTrackId']);

const isAssetReference = (value: unknown): value is AssetReference =>
  isRecord(value) &&
  isNonEmptyString(value['id']) &&
  isOptionalString(value['contentId']) &&
  isNonEmptyString(value['name']) &&
  isOptionalString(value['category']) &&
  isOptionalString(value['notes']) &&
  isOptionalString(value['source']) &&
  (value['provenance'] === undefined ||
    value['provenance'] === 'user_authored' ||
    value['provenance'] === 'approved_content');

const isExperience = (value: unknown): value is CharacterExperience =>
  isRecord(value) &&
  Number.isInteger(value['earned']) &&
  Number.isInteger(value['spent']) &&
  (value['earned'] as number) >= 0 &&
  (value['spent'] as number) >= 0;

const validEntries = <T>(value: unknown, guard: (entry: unknown) => entry is T): readonly T[] =>
  Array.isArray(value) ? value.filter(guard) : [];

const trimOptional = (value: string | undefined): string | undefined => value?.trim() || undefined;

export const isLegacyPersistedActiveCharacter = (
  value: unknown,
): value is LegacyPersistedActiveCharacter =>
  isRecord(value) &&
  isNonEmptyString(value['name']) &&
  isOptionalString(value['id']) &&
  isOptionalString(value['createdAt']) &&
  isOptionalString(value['updatedAt']) &&
  isOptionalString(value['pronouns']) &&
  isOptionalString(value['concept']) &&
  isOptionalString(value['campaignId']) &&
  isStats(value['stats']) &&
  isStatusTracks(value['statusTracks']) &&
  (isMomentumNumber(value['momentum']) || isMomentumState(value['momentum']));

export const migratePersistedActiveCharacter = (
  envelope: VersionedSaveEnvelope<unknown>,
): PersistedActiveCharacter | null => {
  if (
    envelope.schemaVersion < MINIMAL_CHARACTER_SAVE_SCHEMA_VERSION ||
    envelope.schemaVersion > COMPLETE_CHARACTER_SAVE_SCHEMA_VERSION ||
    !isLegacyPersistedActiveCharacter(envelope.payload)
  ) {
    return null;
  }

  const payload = envelope.payload;
  const defaults = createDefaultMomentumState();
  const momentum =
    typeof payload.momentum === 'number'
      ? { ...defaults, current: payload.momentum }
      : { ...payload.momentum };

  return {
    id: trimOptional(payload.id),
    createdAt: trimOptional(payload.createdAt),
    updatedAt: trimOptional(payload.updatedAt),
    name: payload.name.trim(),
    pronouns: trimOptional(payload.pronouns),
    concept: trimOptional(payload.concept),
    campaignId: trimOptional(payload.campaignId),
    stats: { ...payload.stats },
    statusTracks: { ...payload.statusTracks },
    momentum,
    debilities: validEntries(payload.debilities, isDebility).map((debility) => ({
      ...debility,
      label: debility.label.trim(),
      notes: trimOptional(debility.notes),
    })),
    bonds: validEntries(payload.bonds, isBond).map((bond) => ({
      ...bond,
      name: bond.name.trim(),
      description: trimOptional(bond.description),
    })),
    assets: validEntries(payload.assets, isAssetReference).map((asset) => ({
      ...asset,
      name: asset.name.trim(),
      category: trimOptional(asset.category),
      notes: trimOptional(asset.notes),
      source: trimOptional(asset.source),
      provenance: asset.provenance ?? 'user_authored',
    })),
    equipmentNotes: typeof payload.equipmentNotes === 'string' ? payload.equipmentNotes : '',
    notes: typeof payload.notes === 'string' ? payload.notes : '',
    experience: isExperience(payload.experience)
      ? { ...payload.experience }
      : { earned: 0, spent: 0 },
  };
};
