import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { createDefaultCharacter } from '@app/domain/character';
import { createDefaultJournalEntry } from '@app/domain/journal';
import { CUSTOM_ORACLE_PROVENANCE, type CustomOracleTable } from '@app/domain/oracles';
import { createDefaultProgressTrack } from '@app/domain/progress';
import type { RollHistoryEntry } from '@app/domain/rolls';
import { ApplicationAutosaveService } from '@app/domain/services/application-autosave.service';
import { toPersistedCampaignWorkspace } from '@app/domain/services/campaign-workspace-persistence.service';
import { createDefaultVow } from '@app/domain/vows';
import { BROWSER_STORAGE } from '@app/core/storage';
import { ApplicationBackupImportService } from './application-backup-import';
import {
  ApplicationBackupService,
  APPLICATION_BACKUP_FORMAT,
  createBackupFilename,
} from './application-backup';

const createdAt = '2026-07-13T12:00:00.000Z';

const roll: RollHistoryEntry = {
  id: 'roll-1',
  schemaVersion: 1,
  recordStatus: 'active',
  createdAt,
  updatedAt: createdAt,
  type: 'action',
  source: 'manual',
  outcome: 'weak_hit',
  isMatch: false,
  notes: 'Project-original roll note.',
  actionRoll: { actionDie: 4, challengeDice: [3, 7], statBonus: 1, adds: 0, actionScore: 5 },
};

const customOracle: CustomOracleTable = {
  id: 'oracle-1',
  name: 'Project Oracle',
  category: 'Project-original',
  description: 'User-authored table for backup tests.',
  kind: 'table',
  rollRange: { min: 1, max: 2 },
  provenance: { ...CUSTOM_ORACLE_PROVENANCE, sourceId: 'oracle-1' },
  sourceType: 'custom',
  createdAt,
  updatedAt: createdAt,
  entries: [{ id: 'oracle-entry-1', range: { min: 1, max: 2 }, text: 'Project-original result.' }],
  metadata: { contentClass: 'runtime-custom', bundled: false },
};

const configure = (sources: Parameters<ApplicationAutosaveService['registerSource']>[] = []) => {
  TestBed.configureTestingModule({ providers: [{ provide: BROWSER_STORAGE, useValue: null }] });
  const autosave = TestBed.inject(ApplicationAutosaveService);
  for (const [domain, source] of sources) autosave.registerSource(domain, source);
  return { service: TestBed.inject(ApplicationBackupService), autosave };
};

describe('ApplicationBackupService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('exports every supported user-data domain with stable metadata and deterministic structure', () => {
    const character = createDefaultCharacter({
      id: 'character-1',
      name: 'Test Character',
      createdAt,
    });
    const track = createDefaultProgressTrack({
      id: 'track-1',
      title: 'Project Track',
      type: 'vow',
      rank: 'troublesome',
      createdAt,
    });
    const vow = createDefaultVow({
      id: 'vow-1',
      title: 'Project Vow',
      rank: 'troublesome',
      progressTrackId: track.id,
      createdAt,
    });
    const journal = createDefaultJournalEntry({
      id: 'journal-1',
      title: 'Project Journal',
      body: 'Private project-original note.',
      createdAt,
      snapshots: [{ type: 'roll', roll }],
    });
    const workspace = toPersistedCampaignWorkspace({
      progressTracks: [track],
      vows: [vow],
      customOracleTables: [customOracle],
      journalEntries: [journal],
    });
    const { service } = configure([
      ['character', { snapshot: () => character, restore: () => undefined }],
      ['workspace', { snapshot: () => workspace, restore: () => undefined }],
      ['rollHistory', { snapshot: () => [roll], restore: () => undefined }],
    ]);

    const result = service.createBackup(createdAt);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected successful backup');
    expect(Object.keys(result.envelope)).toEqual([
      'format',
      'formatVersion',
      'exportedAt',
      'application',
      'save',
      'validation',
    ]);
    expect(result.envelope.format).toBe(APPLICATION_BACKUP_FORMAT);
    expect(result.envelope.save.payload.character?.name).toBe('Test Character');
    expect(result.envelope.save.payload.workspace?.vows).toHaveLength(1);
    expect(result.envelope.save.payload.workspace?.progressTracks).toHaveLength(1);
    expect(result.envelope.save.payload.workspace?.journalEntries).toHaveLength(1);
    expect(
      result.envelope.save.payload.workspace?.customOracleTables?.[0]?.provenance.category,
    ).toBe('custom');
    expect(result.envelope.save.payload.rollHistory).toHaveLength(1);
    expect(result.counts).toEqual({
      characters: 1,
      progressTracks: 1,
      vows: 1,
      rollHistoryEntries: 1,
      journalEntries: 1,
      customOracleTables: 1,
    });
    expect(result.json).toContain('\n  "format": "ironsworn-local-mvp-backup"');
    expect(result.json).not.toContain('localStorage');
  });

  it('creates a privacy-safe filename without user-authored content', () => {
    expect(
      createBackupFilename({
        appName: 'Ironsworn Companion',
        appVersion: '0.1.0',
        exportedAt: createdAt,
      }),
    ).toBe('ironsworn-companion-backup-2026-07-13-v0-1-0.json');
  });

  it('fails safely when validation rejects current state and does not download', () => {
    const { service } = configure([
      [
        'character',
        {
          snapshot: () => ({ name: '', stats: {}, statusTracks: {}, momentum: 999 }) as never,
          restore: () => undefined,
        },
      ],
    ]);
    const result = service.createBackup(createdAt);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failed backup');
    expect(result.error.code).toBe('malformed-data');
    expect(result.diagnostics.join(' ')).toContain('Character data');
  });

  it('fails safely when state cannot be serialized', () => {
    const cyclic: Record<string, unknown> = { name: 'cycle' };
    cyclic['self'] = cyclic;
    const { service } = configure([
      ['workspace', { snapshot: () => cyclic as never, restore: () => undefined }],
    ]);
    const result = service.createBackup(createdAt);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failed backup');
    expect(result.error.code).toBe('serialization-failed');
  });

  it('does not mutate autosave revision state during export and supports offline download seams', () => {
    const character = createDefaultCharacter({
      id: 'character-1',
      name: 'Test Character',
      createdAt,
    });
    const { service, autosave } = configure([
      ['character', { snapshot: () => character, restore: () => undefined }],
    ]);
    const before = { revision: autosave.revision(), savedRevision: autosave.savedRevision() };
    const result = service.createBackup(createdAt);
    expect(result.ok).toBe(true);
    expect({ revision: autosave.revision(), savedRevision: autosave.savedRevision() }).toEqual(
      before,
    );

    if (!result.ok) throw new Error('expected successful backup');
    const document = TestBed.inject(DOCUMENT);
    const clicked: string[] = [];
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      const element = originalCreate(tagName);
      if (tagName === 'a')
        element.click = () => clicked.push((element as HTMLAnchorElement).download);
      return element;
    }) as Document['createElement']);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    service.downloadBackup(result);
    expect(clicked).toEqual([result.filename]);
  });
});

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

class FailingSetStorage extends MemoryStorage {
  override setItem(): void {
    throw new Error('quota');
  }
}

const configureImport = (storage: MemoryStorage = new MemoryStorage()) => {
  TestBed.configureTestingModule({ providers: [{ provide: BROWSER_STORAGE, useValue: storage }] });
  const autosave = TestBed.inject(ApplicationAutosaveService);
  let character: unknown = null;
  let workspace: unknown = null;
  let rollHistory: unknown = [];
  autosave.registerSource('character', {
    snapshot: () => character as never,
    restore: (value) => {
      character = value;
    },
  });
  autosave.registerSource('workspace', {
    snapshot: () => workspace as never,
    restore: (value) => {
      workspace = value;
    },
  });
  autosave.registerSource('rollHistory', {
    snapshot: () => rollHistory as never,
    restore: (value) => {
      rollHistory = value;
    },
  });
  return {
    service: TestBed.inject(ApplicationBackupImportService),
    autosave,
    storage,
    state: () => ({ character, workspace, rollHistory }),
  };
};

describe('ApplicationBackupImportService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  const validJson = () => {
    TestBed.resetTestingModule();
    const character = createDefaultCharacter({
      id: 'character-1',
      name: 'Import Character',
      createdAt,
    });
    const track = createDefaultProgressTrack({
      id: 'track-1',
      title: 'Import Track',
      type: 'vow',
      rank: 'troublesome',
      createdAt,
    });
    const vow = createDefaultVow({
      id: 'vow-1',
      title: 'Import Vow',
      rank: 'troublesome',
      progressTrackId: track.id,
      createdAt,
    });
    const workspace = toPersistedCampaignWorkspace({
      progressTracks: [track],
      vows: [vow],
      customOracleTables: [customOracle],
      journalEntries: [
        createDefaultJournalEntry({
          id: 'journal-1',
          title: 'Import Journal',
          body: 'Private imported text.',
          createdAt,
        }),
      ],
    });
    const { service } = configure([
      ['character', { snapshot: () => character, restore: () => undefined }],
      ['workspace', { snapshot: () => workspace, restore: () => undefined }],
      ['rollHistory', { snapshot: () => [roll], restore: () => undefined }],
    ]);
    const backup = service.createBackup(createdAt);
    if (!backup.ok) throw new Error('backup failed');
    TestBed.resetTestingModule();
    return backup.json;
  };

  it('previews, validates counts, and restores a valid backup through autosave hydration paths', async () => {
    const json = validJson();
    const { service, state } = configureImport();
    const preview = service.previewJson(json);
    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error('expected preview');
    expect(preview.preview.counts).toMatchObject({
      characters: 1,
      vows: 1,
      progressTracks: 1,
      rollHistoryEntries: 1,
    });
    expect(preview.preview.replacementNotice).toContain('replace all current local');
    const restored = await service.restore(preview.preview, true);
    expect(restored.ok).toBe(true);
    expect((state().character as { name: string }).name).toBe('Import Character');
    expect((state().workspace as { vows: unknown[] }).vows).toHaveLength(1);
  });

  it('leaves state unchanged when confirmation is canceled after preview', async () => {
    const { service, state } = configureImport();
    const preview = service.previewJson(validJson());
    if (!preview.ok) throw new Error('expected preview');
    const result = await service.restore(preview.preview, false);
    expect(result.ok).toBe(false);
    expect(state()).toEqual({ character: null, workspace: null, rollHistory: [] });
  });

  it.each([
    ['malformed JSON', '{'],
    ['invalid format', JSON.stringify({ format: 'other', formatVersion: 1 })],
    [
      'future version',
      JSON.stringify({
        format: APPLICATION_BACKUP_FORMAT,
        formatVersion: 999,
        exportedAt: createdAt,
        application: { version: 'x' },
        validation: { ok: true },
        save: {},
      }),
    ],
  ])('rejects %s without private content in diagnostics', (_label, json) => {
    const { service } = configureImport();
    const result = service.previewJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics.join(' ')).not.toContain('Private imported text');
  });

  it('rejects broken cross-record domains before writing', () => {
    const { service } = configureImport();
    const parsed = JSON.parse(validJson());
    parsed.save.payload.workspace.progressTracks = 'not an array';
    const result = service.previewJson(JSON.stringify(parsed));
    expect(result.ok).toBe(false);
  });

  it('preserves current state when storage write fails', async () => {
    const preview = (() => {
      const p = configureImport().service.previewJson(validJson());
      if (!p.ok) throw new Error('expected preview');
      return p.preview;
    })();
    TestBed.resetTestingModule();
    const { service, state } = configureImport(new FailingSetStorage());
    const result = await service.restore(preview, true);
    expect(result.ok).toBe(false);
    expect(state()).toEqual({ character: null, workspace: null, rollHistory: [] });
  });

  it('rolls back when hydration fails after a successful write', async () => {
    const { service, autosave } = configureImport();
    autosave.registerSource('character', {
      snapshot: () => null,
      restore: () => {
        throw new Error('hydrate');
      },
    });
    const preview = service.previewJson(validJson());
    if (!preview.ok) throw new Error('expected preview');
    const result = await service.restore(preview.preview, true);
    expect(result.ok).toBe(false);
  });
});
