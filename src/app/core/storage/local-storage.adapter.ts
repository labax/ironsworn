import { inject, Injectable, InjectionToken } from '@angular/core';
import { migrateSaveEnvelope, safeParse, safeStringify } from './json-storage.helpers';
import type {
  LoadResult,
  PersistenceAdapter,
  SaveResult,
  VersionedSaveEnvelope,
} from './storage.types';

export interface BrowserStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const BROWSER_STORAGE = new InjectionToken<BrowserStorageLike | null>(
  'Browser localStorage adapter',
  {
    providedIn: 'root',
    factory: () => globalThis.localStorage ?? null,
  },
);

@Injectable({ providedIn: 'root' })
export class LocalStorageAdapter implements PersistenceAdapter {
  private readonly storage = inject(BROWSER_STORAGE, { optional: true });

  async save<T>(key: string, value: VersionedSaveEnvelope<T>): Promise<SaveResult> {
    if (!this.storage) {
      return this.storageUnavailable();
    }
    const serialized = safeStringify(value);
    if (!serialized.success) {
      return { success: false, error: serialized.error };
    }

    try {
      this.storage.setItem(key, serialized.value);
      return { success: true };
    } catch (cause) {
      return {
        success: false,
        error: {
          code: this.isQuotaExceeded(cause) ? 'quota-exceeded' : 'unknown',
          message: this.isQuotaExceeded(cause)
            ? 'Browser storage quota was exceeded while saving data.'
            : 'Unable to save data to browser storage.',
          cause,
        },
      };
    }
  }

  async load<T>(key: string): Promise<LoadResult<T>> {
    if (!this.storage) {
      return {
        success: false,
        error: { code: 'storage-unavailable', message: 'Browser localStorage is not available.' },
      };
    }

    try {
      const rawValue = this.storage.getItem(key);
      if (rawValue === null) {
        return { success: true, found: false };
      }

      const parsed = safeParse<unknown>(rawValue);
      if (!parsed.success) {
        return { success: false, error: parsed.error };
      }

      const migrated = migrateSaveEnvelope<T>(parsed.value);
      if (!migrated.success) {
        return { success: false, error: migrated.error };
      }

      return { success: true, found: true, data: migrated.value };
    } catch (cause) {
      return {
        success: false,
        error: { code: 'unknown', message: 'Unable to load saved data.', cause },
      };
    }
  }

  async remove(key: string): Promise<SaveResult> {
    if (!this.storage) {
      return this.storageUnavailable();
    }
    try {
      this.storage.removeItem(key);
      return { success: true };
    } catch (cause) {
      return {
        success: false,
        error: { code: 'unknown', message: 'Unable to remove saved data.', cause },
      };
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.storage?.getItem(key) !== null;
  }

  private storageUnavailable(): SaveResult {
    return {
      success: false,
      error: { code: 'storage-unavailable', message: 'Browser localStorage is not available.' },
    };
  }

  private isQuotaExceeded(cause: unknown): boolean {
    return (
      cause instanceof DOMException && (cause.name === 'QuotaExceededError' || cause.code === 22)
    );
  }
}
