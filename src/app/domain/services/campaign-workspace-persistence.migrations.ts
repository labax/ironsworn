import { CURRENT_SAVE_SCHEMA_VERSION, type VersionedSaveEnvelope } from '@app/core/storage';
import {
  isChallengeRank,
  isProgressTrackType,
  isValidProgressTicks,
  type ProgressEvent,
  type ProgressTrack,
  type ProgressTrackStatus,
} from '@app/domain/progress';

export const WORKSPACE_SAVE_SCHEMA_VERSION = CURRENT_SAVE_SCHEMA_VERSION;
export const LEGACY_EMPTY_WORKSPACE_SCHEMA_VERSION = 1;
export const WORKSPACE_TRACKS_SCHEMA_VERSION = 3;

export interface PersistedCampaignWorkspace {
  readonly progressTracks: readonly ProgressTrack[];
  readonly selectedProgressTrackId?: string;
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
  const migratedTracks = Array.isArray(payload['progressTracks'])
    ? payload['progressTracks']
        .map(migrateProgressTrack)
        .filter((track): track is ProgressTrack => track !== null)
    : [];
  const selectedProgressTrackId =
    typeof payload['selectedProgressTrackId'] === 'string' &&
    migratedTracks.some((track) => track.id === payload['selectedProgressTrackId'])
      ? payload['selectedProgressTrackId']
      : undefined;

  return { progressTracks: migratedTracks, selectedProgressTrackId };
};
