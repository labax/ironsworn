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
