import { TestBed } from '@angular/core/testing';

import type { PreparedActionRollInput } from './action-roll-input';
import { RollHistoryService } from './roll-history.service';
import type { ActionRollResult } from '@app/rules';

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
