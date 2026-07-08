import { safeStringify } from './json-storage.helpers';
import type { VersionedSaveEnvelope } from './storage.types';

export interface JsonBackupDocument<T> {
  readonly exportedAt: string;
  readonly format: 'ironsworn-local-save-json';
  readonly envelope: VersionedSaveEnvelope<T>;
}

export const createCopyableJsonBackup = <T>(
  envelope: VersionedSaveEnvelope<T>,
  exportedAt = new Date().toISOString(),
) =>
  safeStringify({
    exportedAt,
    format: 'ironsworn-local-save-json',
    envelope,
  } satisfies JsonBackupDocument<T>);
