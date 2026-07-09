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
