import { createSaveEnvelope } from '@app/core/storage';

import {
  COMPLETE_CHARACTER_SAVE_SCHEMA_VERSION,
  MINIMAL_CHARACTER_SAVE_SCHEMA_VERSION,
  migratePersistedActiveCharacter,
  type PersistedActiveCharacter,
} from './active-character-persistence.migrations';

const savedAt = '2026-03-04T05:06:07.000Z';

const minimalPayload = {
  id: 'legacy-character',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  name: 'Vale',
  concept: 'Storm watcher',
  stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
  statusTracks: { health: 4, spirit: 3, supply: 2 },
  momentum: 4,
} satisfies PersistedActiveCharacter;

describe('active character persistence migrations', () => {
  it('migrates a minimal schema save with documented complete-model defaults', () => {
    const migrated = migratePersistedActiveCharacter({
      ...createSaveEnvelope(minimalPayload, {
        appVersion: 'test',
        savedAt,
        schemaVersion: MINIMAL_CHARACTER_SAVE_SCHEMA_VERSION,
      }),
      schemaVersion: MINIMAL_CHARACTER_SAVE_SCHEMA_VERSION,
    });

    expect(migrated).toEqual({
      ...minimalPayload,
      momentum: { current: 4, max: 10, reset: 2, hasOverride: false },
      debilities: [],
      bonds: [],
      assets: [],
      equipmentNotes: '',
      notes: '',
      experience: { earned: 0, spent: 0 },
    });
  });

  it('is idempotent for current schema complete records', () => {
    const current: PersistedActiveCharacter = {
      ...minimalPayload,
      momentum: { current: -1, max: 6, reset: 0, hasOverride: true },
      debilities: [{ id: 'debility-1', category: 'condition', type: 'wounded', label: 'Wounded' }],
      bonds: [{ id: 'bond-1', name: 'Brynn', description: 'Friend' }],
      assets: [{ id: 'asset-1', name: 'Lantern', provenance: 'user_authored' }],
      equipmentNotes: 'Rope',
      notes: 'Keep the old text exactly.',
      experience: { earned: 5, spent: 2 },
    };

    const migrated = migratePersistedActiveCharacter(
      createSaveEnvelope(current, {
        appVersion: 'test',
        savedAt,
        schemaVersion: COMPLETE_CHARACTER_SAVE_SCHEMA_VERSION,
      }),
    );

    expect(migrated).toEqual(current);
  });

  it('recovers valid sibling collection entries while dropping malformed optional entries', () => {
    const migrated = migratePersistedActiveCharacter(
      createSaveEnvelope(
        {
          ...minimalPayload,
          bonds: [{ id: 'bond-1', name: 'Brynn' }, { id: '', name: 'Missing id' }, null],
          assets: [
            { id: 'asset-1', name: 'Lantern', provenance: 'user_authored' },
            { id: 'asset-2', name: '', provenance: 'user_authored' },
          ],
          debilities: [
            { id: 'debility-1', category: 'condition', type: 'wounded', label: 'Wounded' },
            { id: 'debility-2', category: 'bad', type: 'wounded', label: 'Bad' },
          ],
        },
        { appVersion: 'test', savedAt, schemaVersion: COMPLETE_CHARACTER_SAVE_SCHEMA_VERSION },
      ),
    );

    expect(migrated?.bonds).toEqual([{ id: 'bond-1', name: 'Brynn', description: undefined }]);
    expect(migrated?.assets).toEqual([
      { id: 'asset-1', name: 'Lantern', provenance: 'user_authored' },
    ]);
    expect(migrated?.debilities).toEqual([
      {
        id: 'debility-1',
        category: 'condition',
        type: 'wounded',
        label: 'Wounded',
        notes: undefined,
      },
    ]);
  });

  it('rejects corrupt required character data instead of fabricating required fields', () => {
    const migrated = migratePersistedActiveCharacter(
      createSaveEnvelope(
        { ...minimalPayload, name: '', stats: { ...minimalPayload.stats, edge: -1 } },
        { appVersion: 'test', savedAt, schemaVersion: COMPLETE_CHARACTER_SAVE_SCHEMA_VERSION },
      ),
    );

    expect(migrated).toBeNull();
  });
});
