import { CURRENT_SAVE_SCHEMA_VERSION, type VersionedSaveEnvelope } from '@app/core/storage';
import {
  isChallengeRank,
  isProgressTrackType,
  isValidProgressTicks,
  type ProgressEvent,
  type ProgressTrack,
  type ProgressTrackStatus,
} from '@app/domain/progress';
import { CUSTOM_ORACLE_PROVENANCE, type CustomOracleTable } from '@app/domain/oracles';
import { isVowStatus, type Vow, type VowMilestone, type VowOutcome } from '@app/domain/vows';

export const WORKSPACE_SAVE_SCHEMA_VERSION = CURRENT_SAVE_SCHEMA_VERSION;
export const LEGACY_EMPTY_WORKSPACE_SCHEMA_VERSION = 1;
export const WORKSPACE_TRACKS_SCHEMA_VERSION = 3;

export interface PersistedCampaignWorkspace {
  readonly progressTracks: readonly ProgressTrack[];
  readonly selectedProgressTrackId?: string;
  readonly vows: readonly Vow[];
  readonly selectedVowId?: string;
  readonly customOracleTables?: readonly CustomOracleTable[];
  readonly selectedCustomOracleTableId?: string;
}

const STATUSES: readonly ProgressTrackStatus[] = [
  'active',
  'completed',
  'failed',
  'forsaken',
  'archived',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === 'string';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const optionalText = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const isProgressEvent = (value: unknown): value is ProgressEvent =>
  isRecord(value) &&
  isNonEmptyString(value['id']) &&
  isNonEmptyString(value['createdAt']) &&
  Number.isInteger(value['ticksDelta']) &&
  isOptionalString(value['note']) &&
  isOptionalString(value['rollId']);

const migrateProgressTrack = (value: unknown): ProgressTrack | null => {
  if (!isRecord(value)) return null;
  const mode = value['progressMode'] === 'manual_override' ? 'manual_override' : 'standard';
  const rawTicks = value['ticks'];

  if (
    !isNonEmptyString(value['id']) ||
    !isNonEmptyString(value['createdAt']) ||
    !isProgressTrackType(value['type']) ||
    !isNonEmptyString(value['title']) ||
    !isChallengeRank(value['rank']) ||
    !Number.isInteger(rawTicks) ||
    (mode === 'standard' && !isValidProgressTicks(rawTicks as number)) ||
    !STATUSES.includes(value['status'] as ProgressTrackStatus) ||
    !isOptionalString(value['updatedAt']) ||
    !isOptionalString(value['characterId']) ||
    !isOptionalString(value['campaignId']) ||
    !isOptionalString(value['notes']) ||
    !isOptionalString(value['overrideReason'])
  ) {
    return null;
  }

  const ticks = rawTicks as number;

  return {
    schemaVersion: Number.isInteger(value['schemaVersion'])
      ? (value['schemaVersion'] as number)
      : 1,
    recordStatus: value['recordStatus'] === 'deleted' ? 'deleted' : 'active',
    id: value['id'],
    createdAt: value['createdAt'],
    updatedAt: typeof value['updatedAt'] === 'string' ? value['updatedAt'] : value['createdAt'],
    type: value['type'],
    title: value['title'],
    rank: value['rank'],
    ticks,
    status: value['status'] as ProgressTrackStatus,
    characterId: optionalText(value['characterId']),
    campaignId: optionalText(value['campaignId']),
    events: Array.isArray(value['events'])
      ? value['events'].filter(isProgressEvent).map((event) => ({ ...event }))
      : [],
    notes: optionalText(value['notes']),
    progressMode: mode,
    overrideReason: optionalText(value['overrideReason']),
  };
};

const migrateVowMilestone = (value: unknown): VowMilestone | null => {
  if (!isRecord(value) || !isNonEmptyString(value['id']) || !isNonEmptyString(value['createdAt'])) {
    return null;
  }
  if (!isOptionalString(value['updatedAt']) || !isOptionalString(value['note'])) return null;
  return {
    id: value['id'],
    createdAt: value['createdAt'],
    updatedAt: optionalText(value['updatedAt']),
    note: optionalText(value['note']),
  };
};

const migrateVowOutcome = (value: unknown): VowOutcome | undefined => {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return undefined;
  if (
    !isOptionalString(value['resolvedAt']) ||
    !isOptionalString(value['summary']) ||
    !isOptionalString(value['rollId'])
  ) {
    return undefined;
  }
  return {
    resolvedAt: optionalText(value['resolvedAt']),
    summary: optionalText(value['summary']),
    rollId: optionalText(value['rollId']),
  };
};

const migrateVow = (value: unknown): Vow | null => {
  if (!isRecord(value)) return null;
  if (
    !isNonEmptyString(value['id']) ||
    !isNonEmptyString(value['createdAt']) ||
    !isNonEmptyString(value['title']) ||
    !isChallengeRank(value['rank']) ||
    !isVowStatus(value['status']) ||
    !isOptionalString(value['updatedAt']) ||
    !isOptionalString(value['description']) ||
    !isOptionalString(value['characterId']) ||
    !isOptionalString(value['campaignId']) ||
    !isOptionalString(value['progressTrackId']) ||
    !isOptionalString(value['notes'])
  ) {
    return null;
  }

  return {
    schemaVersion: Number.isInteger(value['schemaVersion'])
      ? (value['schemaVersion'] as number)
      : 1,
    recordStatus:
      value['recordStatus'] === 'deleted' || value['recordStatus'] === 'archived'
        ? value['recordStatus']
        : 'active',
    id: value['id'],
    createdAt: value['createdAt'],
    updatedAt: optionalText(value['updatedAt']) ?? value['createdAt'],
    title: value['title'],
    type:
      value['type'] === 'background' ||
      value['type'] === 'inciting_incident' ||
      value['type'] === 'normal'
        ? value['type']
        : 'normal',
    rank: value['rank'],
    status: value['status'],
    description: optionalText(value['description']),
    characterId: optionalText(value['characterId']),
    campaignId: optionalText(value['campaignId']),
    progressTrackId: optionalText(value['progressTrackId']),
    notes: optionalText(value['notes']) ?? '',
    milestones: Array.isArray(value['milestones'])
      ? value['milestones']
          .map(migrateVowMilestone)
          .filter((milestone): milestone is VowMilestone => milestone !== null)
      : [],
    outcome: migrateVowOutcome(value['outcome']),
  };
};

const migrateCustomOracleTable = (value: unknown): CustomOracleTable | null => {
  if (!isRecord(value)) return null;
  const rollRange = value['rollRange'];
  const provenance = value['provenance'];
  if (
    !isNonEmptyString(value['id']) ||
    !isNonEmptyString(value['createdAt']) ||
    !isNonEmptyString(value['updatedAt']) ||
    !isNonEmptyString(value['name']) ||
    !isNonEmptyString(value['category']) ||
    !isOptionalString(value['description']) ||
    !isRecord(rollRange) ||
    !Number.isInteger(rollRange['min']) ||
    !Number.isInteger(rollRange['max']) ||
    !Array.isArray(value['entries']) ||
    !isRecord(provenance) ||
    (provenance['category'] !== 'custom' && provenance['category'] !== 'user_authored')
  ) {
    return null;
  }

  const entries = value['entries']
    .filter(isRecord)
    .map((entry): CustomOracleTable['entries'][number] | null => {
      const range = entry['range'];
      if (
        !isNonEmptyString(entry['id']) ||
        !isRecord(range) ||
        !Number.isInteger(range['min']) ||
        !Number.isInteger(range['max']) ||
        !isNonEmptyString(entry['text'])
      ) {
        return null;
      }
      return {
        id: entry['id'],
        range: { min: range['min'] as number, max: range['max'] as number },
        text: entry['text'],
        provenance: { ...CUSTOM_ORACLE_PROVENANCE, sourceId: value['id'] as string },
      };
    })
    .filter((entry): entry is CustomOracleTable['entries'][number] => entry !== null);

  return {
    id: value['id'],
    name: value['name'],
    category: value['category'],
    description: optionalText(value['description']) ?? 'User-authored custom oracle table.',
    kind: 'table',
    rollRange: { min: rollRange['min'] as number, max: rollRange['max'] as number },
    provenance: { ...CUSTOM_ORACLE_PROVENANCE, sourceId: value['id'] as string },
    sourceType: 'custom',
    createdAt: value['createdAt'],
    updatedAt: value['updatedAt'],
    entries,
    metadata: { contentClass: 'runtime-custom', bundled: false },
  };
};

export const migratePersistedCampaignWorkspace = (
  envelope: VersionedSaveEnvelope<unknown>,
): PersistedCampaignWorkspace | null => {
  if (
    envelope.schemaVersion < LEGACY_EMPTY_WORKSPACE_SCHEMA_VERSION ||
    envelope.schemaVersion > WORKSPACE_SAVE_SCHEMA_VERSION ||
    !isRecord(envelope.payload)
  ) {
    return null;
  }

  const payload = envelope.payload;
  if (
    (payload['progressTracks'] !== undefined && !Array.isArray(payload['progressTracks'])) ||
    (payload['vows'] !== undefined && !Array.isArray(payload['vows'])) ||
    (payload['customOracleTables'] !== undefined && !Array.isArray(payload['customOracleTables']))
  ) {
    return null;
  }

  const migratedTracks = Array.isArray(payload['progressTracks'])
    ? payload['progressTracks']
        .map(migrateProgressTrack)
        .filter((track): track is ProgressTrack => track !== null)
    : [];
  const migratedVows = Array.isArray(payload['vows'])
    ? payload['vows'].map(migrateVow).filter((vow): vow is Vow => vow !== null)
    : [];
  const migratedCustomOracleTables = Array.isArray(payload['customOracleTables'])
    ? payload['customOracleTables']
        .map(migrateCustomOracleTable)
        .filter((table): table is CustomOracleTable => table !== null)
    : [];
  const selectedProgressTrackId =
    typeof payload['selectedProgressTrackId'] === 'string' &&
    migratedTracks.some((track) => track.id === payload['selectedProgressTrackId'])
      ? payload['selectedProgressTrackId']
      : undefined;
  const selectedVowId =
    typeof payload['selectedVowId'] === 'string' &&
    migratedVows.some((vow) => vow.id === payload['selectedVowId'])
      ? payload['selectedVowId']
      : undefined;

  const selectedCustomOracleTableId =
    typeof payload['selectedCustomOracleTableId'] === 'string' &&
    migratedCustomOracleTables.some((table) => table.id === payload['selectedCustomOracleTableId'])
      ? payload['selectedCustomOracleTableId']
      : undefined;

  return {
    progressTracks: migratedTracks,
    selectedProgressTrackId,
    vows: migratedVows,
    selectedVowId,
    ...(migratedCustomOracleTables.length > 0 || payload['customOracleTables'] !== undefined
      ? { customOracleTables: migratedCustomOracleTables, selectedCustomOracleTableId }
      : {}),
  };
};
