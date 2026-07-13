import { TestBed } from '@angular/core/testing';

import { BROWSER_STORAGE, createSaveEnvelope, type BrowserStorageLike } from '@app/core/storage';
import type { ActionRollResult } from '@app/rules';
import { environment } from '@environments/environment';

import type { PreparedActionRollInput } from './action-roll-input';
import { migrateRollHistoryEntries } from './roll-history.migrations';
import { ROLL_HISTORY_STORAGE_KEY } from './roll-history.persistence';
import { RollHistoryService } from './roll-history.service';

const preparedInput = (
  overrides: Partial<PreparedActionRollInput> = {},
): PreparedActionRollInput => ({
  label: 'Face danger',
  statValue: 3,
  adds: 1,
  source: 'manual',
  ...overrides,
});

const resolvedRoll = (overrides: Partial<ActionRollResult> = {}): ActionRollResult => ({
  actionDie: 5,
  challengeDice: [4, 8],
  statBonus: 3,
  adds: 1,
  rawScore: 9,
  cappedScore: 9,
  outcome: 'weak_hit',
  challengeResults: [true, false],
  isMatch: false,
  trace: ['test trace'],
  ...overrides,
});

describe('RollHistoryService', () => {
  let service: RollHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RollHistoryService);
    service.clear();
  });

  it('saves one completed action roll as a mechanical snapshot', () => {
    const entry = service.saveActionRoll({
      prepared: preparedInput(),
      result: resolvedRoll(),
      createdAt: '2026-07-09T00:00:00.000Z',
    });

    expect(entry).toMatchObject({
      id: 'roll-history-1',
      type: 'action',
      source: 'generated',
      label: 'Face danger',
      outcome: 'weak_hit',
      isMatch: false,
      createdAt: '2026-07-09T00:00:00.000Z',
      actionRoll: {
        actionDie: 5,
        challengeDice: [4, 8],
        statBonus: 3,
        adds: 1,
        actionScore: 9,
      },
    });
    expect(service.entries()).toHaveLength(1);
  });

  it('keeps multiple saved rolls in deterministic oldest-first order', () => {
    service.saveActionRoll({
      prepared: preparedInput({ label: 'First roll' }),
      result: resolvedRoll({ actionDie: 2, cappedScore: 6 }),
      createdAt: '2026-07-09T00:00:00.000Z',
    });
    service.saveActionRoll({
      prepared: preparedInput({ label: 'Second roll' }),
      result: resolvedRoll({ actionDie: 6, cappedScore: 10, outcome: 'strong_hit' }),
      createdAt: '2026-07-09T00:01:00.000Z',
    });

    expect(
      service.entries().map((entry) => [entry.id, entry.label, entry.actionRoll?.actionDie]),
    ).toEqual([
      ['roll-history-1', 'First roll', 2],
      ['roll-history-2', 'Second roll', 6],
    ]);
  });

  it('preserves saved entries as stable snapshots when source objects change', () => {
    const prepared = preparedInput({ label: 'Original label', statValue: 2, adds: 0 });
    const result = resolvedRoll({ challengeDice: [1, 10], cappedScore: 7 });

    service.saveActionRoll({ prepared, result, createdAt: '2026-07-09T00:00:00.000Z' });
    (result.challengeDice as [number, number])[0] = 10;
    const readEntry = service.entries()[0];
    (readEntry.actionRoll!.challengeDice as [number, number])[1] = 1;

    expect(service.entries()[0]).toMatchObject({
      label: 'Original label',
      actionRoll: {
        challengeDice: [1, 10],
        statBonus: 2,
        adds: 0,
        actionScore: 7,
      },
    });
  });
});

const oracleResult = (
  overrides: Partial<import('@app/rules/oracles').ResolvedOracleTableResult> = {},
): import('@app/rules/oracles').ResolvedOracleTableResult => ({
  id: 'oracle:first:3:entry-low',
  tableId: 'oracle:first',
  tableName: 'First Table',
  tableKind: 'table',
  roll: 3,
  rollRange: { min: 1, max: 6 },
  entryId: 'entry-low',
  entryRange: { min: 1, max: 3 },
  text: 'Project-original fixture result',
  provenance: {
    category: 'project_original',
    title: 'Fixture provenance',
    license: 'Project original',
    releaseStatus: 'allowed',
    reviewStatus: 'reviewed',
    manifestId: 'fixture-manifest',
    reviewedForUse: true,
  },
  tableProvenance: {
    category: 'project_original',
    title: 'Fixture table provenance',
    license: 'Project original',
    releaseStatus: 'allowed',
    reviewStatus: 'reviewed',
    manifestId: 'table-manifest',
    reviewedForUse: true,
  },
  timestamp: '2026-07-09T00:02:00.000Z',
  sourceType: 'project_original',
  ...overrides,
});

describe('RollHistoryService oracle rolls', () => {
  let service: RollHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RollHistoryService);
    service.clear();
  });

  it('saves one resolved oracle roll as a complete shared history snapshot', () => {
    const entry = service.saveOracleRoll({
      result: oracleResult({ questionContext: 'Check the ravine.' }),
      note: 'Follow up with the guide.',
      clientSaveKey: 'ui-event-1',
    });

    expect(entry).toMatchObject({
      id: 'roll-history-1',
      type: 'oracle',
      source: 'generated',
      outcome: 'oracle_result',
      oracleTableId: 'oracle:first',
      oracleEntryId: 'entry-low',
      createdAt: '2026-07-09T00:02:00.000Z',
      notes: 'Follow up with the guide.',
      oracleRoll: {
        roll: 3,
        tableId: 'oracle:first',
        tableName: 'First Table',
        entryId: 'entry-low',
        resultText: 'Project-original fixture result',
        questionContext: 'Check the ravine.',
        provenance: { manifestId: 'fixture-manifest' },
      },
    });
    expect(service.entries()).toHaveLength(1);
  });

  it('keeps action and oracle records in deterministic shared oldest-first order', () => {
    service.saveActionRoll({
      prepared: preparedInput({ label: 'Face danger' }),
      result: resolvedRoll(),
      createdAt: '2026-07-09T00:00:00.000Z',
    });
    service.saveOracleRoll({
      result: oracleResult({ timestamp: '2026-07-09T00:01:00.000Z', roll: 2 }),
    });
    service.saveOracleRoll({
      result: oracleResult({
        timestamp: '2026-07-09T00:02:00.000Z',
        roll: 5,
        entryId: 'entry-high',
      }),
    });

    expect(service.entries().map((entry) => [entry.id, entry.type, entry.createdAt])).toEqual([
      ['roll-history-1', 'action', '2026-07-09T00:00:00.000Z'],
      ['roll-history-2', 'oracle', '2026-07-09T00:01:00.000Z'],
      ['roll-history-3', 'oracle', '2026-07-09T00:02:00.000Z'],
    ]);
  });

  it('prevents duplicate oracle saves for repeated delivery of the same resolved snapshot', () => {
    const resolved = oracleResult();
    const first = service.saveOracleRoll({ result: resolved, clientSaveKey: 'same-ui-event' });
    const second = service.saveOracleRoll({ result: resolved, clientSaveKey: 'same-ui-event' });

    expect(second.id).toBe(first.id);
    expect(service.entries()).toHaveLength(1);
  });

  it('preserves immutable oracle snapshots when source results are changed after saving', () => {
    const resolved = oracleResult();
    service.saveOracleRoll({ result: resolved });
    (resolved as { tableName: string }).tableName = 'Changed Table';
    (resolved as { text: string }).text = 'Changed result';
    (resolved.provenance as { manifestId: string }).manifestId = 'changed-manifest';
    const readEntry = service.entries()[0];
    (readEntry.oracleRoll!.provenance as { manifestId: string }).manifestId = 'mutated-read';

    expect(service.entries()[0].oracleRoll).toMatchObject({
      tableName: 'First Table',
      resultText: 'Project-original fixture result',
      provenance: { manifestId: 'fixture-manifest' },
    });
  });

  it('preserves stable references when source table text is changed or deleted later', () => {
    service.saveOracleRoll({
      result: oracleResult({ text: undefined, textRef: 'oracle:first.entries.entry-low.text' }),
    });

    expect(service.entries()[0].oracleRoll).toMatchObject({
      resultTextRef: 'oracle:first.entries.entry-low.text',
      tableId: 'oracle:first',
      tableName: 'First Table',
    });
  });
});

describe('RollHistoryService progress rolls', () => {
  let service: RollHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RollHistoryService);
    service.clear();
  });

  const progressRoll = (
    overrides: Partial<import('@app/rules').ProgressRollResult> = {},
  ): import('@app/rules').ProgressRollResult => ({
    type: 'progress',
    trackId: 'track-ravine',
    rolledAt: '2026-07-09T00:03:00.000Z',
    source: 'generated',
    progressScore: 6,
    challengeDice: [4, 9],
    outcome: 'weak_hit',
    challengeResults: [true, false],
    isMatch: false,
    trace: ['progress score compares directly to challenge dice'],
    ...overrides,
  });

  it('saves one completed progress roll as a complete shared history snapshot', () => {
    const entry = service.saveProgressRoll({
      result: progressRoll({ challengeDice: [3, 3], outcome: 'strong_hit', isMatch: true }),
      trackTitle: 'Cross the broken bridge',
      trackType: 'journey',
      vowId: 'vow-bridge',
      vowTitle: 'Reach the far watchtower',
      note: 'Player-authored follow-up note.',
      clientSaveKey: 'progress-click-1',
    });

    expect(entry).toMatchObject({
      id: 'roll-history-1',
      type: 'progress',
      source: 'generated',
      progressTrackId: 'track-ravine',
      outcome: 'strong_hit',
      isMatch: true,
      createdAt: '2026-07-09T00:03:00.000Z',
      notes: 'Player-authored follow-up note.',
      progressRoll: {
        progressScore: 6,
        challengeDice: [3, 3],
        trackId: 'track-ravine',
        trackType: 'journey',
        trackTitle: 'Cross the broken bridge',
        vowId: 'vow-bridge',
        vowTitle: 'Reach the far watchtower',
        resolvedAt: '2026-07-09T00:03:00.000Z',
      },
    });
    expect(service.entries()).toHaveLength(1);
  });

  it('keeps action, oracle, and progress records in deterministic shared oldest-first order', () => {
    service.saveActionRoll({
      prepared: preparedInput({ label: 'First action' }),
      result: resolvedRoll(),
      createdAt: '2026-07-09T00:00:00.000Z',
    });
    service.saveProgressRoll({
      result: progressRoll({ rolledAt: '2026-07-09T00:01:00.000Z', challengeDice: [2, 8] }),
      trackTitle: 'Secure the ford',
      trackType: 'custom',
    });
    service.saveProgressRoll({
      result: progressRoll({ rolledAt: '2026-07-09T00:02:00.000Z', challengeDice: [1, 10] }),
      trackTitle: 'Scout the marsh',
      trackType: 'journey',
    });

    expect(service.entries().map((entry) => [entry.id, entry.type, entry.createdAt])).toEqual([
      ['roll-history-1', 'action', '2026-07-09T00:00:00.000Z'],
      ['roll-history-2', 'progress', '2026-07-09T00:01:00.000Z'],
      ['roll-history-3', 'progress', '2026-07-09T00:02:00.000Z'],
    ]);
  });

  it('prevents duplicate progress saves for repeated activation of the same completed roll', () => {
    const resolved = progressRoll();
    const first = service.saveProgressRoll({
      result: resolved,
      trackTitle: 'Secure the ford',
      trackType: 'custom',
      clientSaveKey: 'same-progress-event',
    });
    const second = service.saveProgressRoll({
      result: resolved,
      trackTitle: 'Secure the ford',
      trackType: 'custom',
      clientSaveKey: 'same-progress-event',
    });

    expect(second.id).toBe(first.id);
    expect(service.entries()).toHaveLength(1);
  });

  it('preserves immutable progress snapshots when source track or vow changes or is deleted', () => {
    const resolved = progressRoll({ challengeDice: [5, 6] });
    service.saveProgressRoll({
      result: resolved,
      trackTitle: 'Original track title',
      trackType: 'vow',
      vowId: 'vow-original',
      vowTitle: 'Original vow title',
    });
    (resolved.challengeDice as [number, number])[0] = 10;
    const readEntry = service.entries()[0];
    (readEntry.progressRoll!.challengeDice as [number, number])[1] = 1;

    expect(service.entries()[0]).toMatchObject({
      progressRoll: {
        progressScore: 6,
        challengeDice: [5, 6],
        trackTitle: 'Original track title',
        trackType: 'vow',
        vowId: 'vow-original',
        vowTitle: 'Original vow title',
      },
    });
  });
});

class MemoryHistoryStorage implements BrowserStorageLike {
  readonly values = new Map<string, string>();
  failSet = false;
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failSet) throw new Error('storage unavailable for test');
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const mixedHistoryFixture = () => {
  TestBed.resetTestingModule();
  const storage = new MemoryHistoryStorage();
  TestBed.configureTestingModule({ providers: [{ provide: BROWSER_STORAGE, useValue: storage }] });
  const history = TestBed.inject(RollHistoryService);
  history.clear();
  const action = history.saveActionRoll({
    prepared: preparedInput({ label: 'Secure the gate' }),
    result: resolvedRoll({ actionDie: 4, challengeDice: [5, 5], outcome: 'miss', isMatch: true }),
    createdAt: '2026-07-09T00:00:00.000Z',
    note: 'User-authored action context.',
  });
  history.finalizeActionRollMomentumBurn({
    id: action.id,
    prepared: preparedInput({ label: 'Secure the gate' }),
    result: resolvedRoll({ actionDie: 4, challengeDice: [5, 5], outcome: 'miss', isMatch: true }),
    finalOutcome: 'strong_hit',
    momentumBurn: {
      applied: true,
      canceledDice: [
        { position: 0, value: 5 },
        { position: 1, value: 5 },
      ],
      momentumUsed: 6,
      resetValue: 2,
      initialOutcome: 'miss',
      finalOutcome: 'strong_hit',
      originalMatch: true,
    },
  });
  history.saveProgressRoll({
    result: {
      type: 'progress',
      trackId: 'track-old-gate',
      rolledAt: '2026-07-09T00:01:00.000Z',
      source: 'generated',
      progressScore: 8,
      challengeDice: [2, 9],
      outcome: 'weak_hit',
      challengeResults: [true, false],
      isMatch: false,
      trace: ['fixture'],
    },
    trackTitle: 'Original gate track snapshot',
    trackType: 'vow',
    vowId: 'vow-gate',
    vowTitle: 'Hold the old gate',
    note: 'User-authored progress note.',
  });
  history.saveOracleRoll({
    result: oracleResult({
      timestamp: '2026-07-09T00:02:00.000Z',
      questionContext: 'User-authored oracle question.',
      textRef: 'oracle:first.entries.entry-low.text',
    }),
    note: 'User-authored oracle note.',
  });
  return { storage, entries: history.entries() };
};

describe('RollHistory persistence and migrations', () => {
  it('round-trips mixed action, progress, and oracle records without loss, reordering, or duplication', async () => {
    const { storage, entries } = mixedHistoryFixture();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    });
    const restored = TestBed.inject(RollHistoryService);

    const result = await restored.loadSavedHistory();
    await restored.loadSavedHistory();

    expect(result).toMatchObject({
      success: true,
      found: true,
      recoveredCount: 3,
      discardedCount: 0,
    });
    expect(restored.entries()).toEqual(entries);
    expect(restored.entries().map((entry) => entry.id)).toEqual([
      'roll-history-1',
      'roll-history-2',
      'roll-history-3',
    ]);
  });

  it('preserves Momentum burn, notes/context, source snapshots/links, and provenance after reload', async () => {
    const { storage } = mixedHistoryFixture();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    });
    const restored = TestBed.inject(RollHistoryService);

    await restored.loadSavedHistory();
    const [action, progress, oracle] = restored.entries();

    expect(action.momentumBurn).toEqual({
      applied: true,
      canceledDice: [
        { position: 0, value: 5 },
        { position: 1, value: 5 },
      ],
      momentumUsed: 6,
      resetValue: 2,
      initialOutcome: 'miss',
      finalOutcome: 'strong_hit',
      originalMatch: true,
    });
    expect(action.notes).toBe('User-authored action context.');
    expect(progress.progressRoll).toMatchObject({
      trackId: 'track-old-gate',
      trackTitle: 'Original gate track snapshot',
      vowId: 'vow-gate',
      vowTitle: 'Hold the old gate',
    });
    expect(oracle.oracleRoll).toMatchObject({
      resultTextRef: 'oracle:first.entries.entry-low.text',
      questionContext: 'User-authored oracle question.',
      provenance: { manifestId: 'fixture-manifest' },
      tableProvenance: { manifestId: 'table-manifest' },
    });
  });

  it('validates each variant independently and preserves valid siblings when unknown or malformed records appear', () => {
    const valid = mixedHistoryFixture().entries;
    const migrated = migrateRollHistoryEntries({
      entries: [
        valid[0],
        { ...valid[1], type: 'future-roll' },
        { ...valid[2], oracleRoll: { roll: 4 } },
      ],
    });

    expect(migrated).toMatchObject({ ok: true, discardedCount: 2 });
    expect(migrated.ok ? migrated.entries : []).toEqual([valid[0]]);
  });

  it('rejects a corrupt envelope payload without clearing current in-memory history', async () => {
    TestBed.resetTestingModule();
    const storage = new MemoryHistoryStorage();
    storage.setItem(
      ROLL_HISTORY_STORAGE_KEY,
      JSON.stringify(createSaveEnvelope({ wrong: true }, { appVersion: environment.appVersion })),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    });
    const current = { ...mixedHistoryFixture().entries[0], id: 'current-in-memory' };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    });
    const historyWithCorruptStorage = TestBed.inject(RollHistoryService);
    historyWithCorruptStorage.restoreEntries([current]);

    const result = await historyWithCorruptStorage.loadSavedHistory();

    expect(result.success).toBe(false);
    expect(historyWithCorruptStorage.entries()).toEqual([current]);
  });

  it('migrates supported older array payloads deterministically and leaves current-schema records idempotent', () => {
    const valid = mixedHistoryFixture().entries;
    const oldFormat = valid.map(
      ({ schemaVersion: _schemaVersion, updatedAt: _updatedAt, ...entry }) => entry,
    );

    const migrated = migrateRollHistoryEntries(oldFormat);
    const current = migrateRollHistoryEntries(valid);

    expect(migrated).toMatchObject({ ok: true, discardedCount: 0 });
    expect(migrated.ok ? migrated.entries.map((entry) => entry.updatedAt) : []).toEqual(
      valid.map((entry) => entry.createdAt),
    );
    expect(current).toEqual({ ok: true, entries: valid, discardedCount: 0 });
  });

  it('prevents duplicates after restore and keeps restored snapshots immutable when source state changes', async () => {
    const { storage } = mixedHistoryFixture();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    });
    const restored = TestBed.inject(RollHistoryService);
    await restored.loadSavedHistory();

    const duplicate = restored.saveOracleRoll({
      result: oracleResult(),
      clientSaveKey: restored.entries()[2].label,
    });
    const read = restored.entries()[1];
    (read.progressRoll!.challengeDice as [number, number])[0] = 10;

    expect(duplicate.id).toBe('roll-history-3');
    expect(restored.entries()).toHaveLength(3);
    expect(restored.entries()[1].progressRoll).toMatchObject({
      challengeDice: [2, 9],
      trackTitle: 'Original gate track snapshot',
    });
  });

  it('exposes save failures while preserving in-memory history', async () => {
    TestBed.resetTestingModule();
    const storage = new MemoryHistoryStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    });
    const history = TestBed.inject(RollHistoryService);
    storage.failSet = true;

    const entry = history.saveActionRoll({ prepared: preparedInput(), result: resolvedRoll() });
    const result = await history.persistCurrentHistory();

    expect(result.success).toBe(false);
    expect(history.saveStatus()).toBe('failed');
    expect(history.entries()).toEqual([entry]);
  });
});
