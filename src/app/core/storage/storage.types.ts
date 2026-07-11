export const CURRENT_SAVE_SCHEMA_VERSION = 3;

export type StorageErrorCode =
  | 'storage-unavailable'
  | 'quota-exceeded'
  | 'malformed-data'
  | 'unsupported-version'
  | 'serialization-failed'
  | 'unknown';

export interface StorageError {
  readonly code: StorageErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}

export interface VersionedSaveEnvelope<T> {
  readonly schemaVersion: number;
  readonly appVersion: string;
  readonly savedAt: string;
  readonly payload: T;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type SaveResult =
  { readonly success: true } | { readonly success: false; readonly error: StorageError };

export type LoadResult<T> =
  | { readonly success: true; readonly found: true; readonly data: VersionedSaveEnvelope<T> }
  | { readonly success: true; readonly found: false }
  | { readonly success: false; readonly error: StorageError };

export interface PersistenceAdapter {
  save<T>(key: string, value: VersionedSaveEnvelope<T>): Promise<SaveResult>;
  load<T>(key: string): Promise<LoadResult<T>>;
  remove(key: string): Promise<SaveResult>;
  exists(key: string): Promise<boolean>;
}

export const createSaveEnvelope = <T>(
  payload: T,
  options: {
    readonly appVersion: string;
    readonly savedAt?: string;
    readonly schemaVersion?: number;
    readonly metadata?: Readonly<Record<string, unknown>>;
  },
): VersionedSaveEnvelope<T> => ({
  schemaVersion: options.schemaVersion ?? CURRENT_SAVE_SCHEMA_VERSION,
  appVersion: options.appVersion,
  savedAt: options.savedAt ?? new Date().toISOString(),
  payload,
  metadata: options.metadata,
});
