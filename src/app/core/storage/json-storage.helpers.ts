import {
  CURRENT_SAVE_SCHEMA_VERSION,
  type StorageError,
  type VersionedSaveEnvelope,
} from './storage.types';

export type ParseResult<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: StorageError };

export const safeStringify = (value: unknown): ParseResult<string> => {
  try {
    return { success: true, value: JSON.stringify(value) };
  } catch (cause) {
    return {
      success: false,
      error: {
        code: 'serialization-failed',
        message: 'Unable to serialize data for storage.',
        cause,
      },
    };
  }
};

export const safeParse = <T>(rawValue: string): ParseResult<T> => {
  try {
    return { success: true, value: JSON.parse(rawValue) as T };
  } catch (cause) {
    return {
      success: false,
      error: { code: 'malformed-data', message: 'Saved data is not valid JSON.', cause },
    };
  }
};

export const isVersionedSaveEnvelope = <T>(value: unknown): value is VersionedSaveEnvelope<T> => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<VersionedSaveEnvelope<T>>;
  return (
    typeof candidate.schemaVersion === 'number' &&
    Number.isInteger(candidate.schemaVersion) &&
    typeof candidate.appVersion === 'string' &&
    typeof candidate.savedAt === 'string' &&
    'payload' in candidate
  );
};

export const migrateSaveEnvelope = <T>(value: unknown): ParseResult<VersionedSaveEnvelope<T>> => {
  if (!isVersionedSaveEnvelope<T>(value)) {
    return {
      success: false,
      error: {
        code: 'malformed-data',
        message: 'Saved data is missing required schema/version metadata.',
      },
    };
  }

  if (value.schemaVersion === CURRENT_SAVE_SCHEMA_VERSION) {
    return { success: true, value };
  }

  return {
    success: false,
    error: {
      code: 'unsupported-version',
      message: `Saved data schema version ${value.schemaVersion} is not supported by this build.`,
    },
  };
};
