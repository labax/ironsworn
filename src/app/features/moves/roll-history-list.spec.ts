import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RollHistoryService, type PreparedActionRollInput } from '@app/domain/rolls';
import type { ActionRollResult } from '@app/rules';
import type { ResolvedOracleTableResult } from '@app/rules/oracles';

import { RollHistoryList } from './roll-history-list';

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

describe('RollHistoryList', () => {
  let fixture: ComponentFixture<RollHistoryList>;
  let rollHistory: RollHistoryService;

  const createComponent = () => {
    fixture = TestBed.createComponent(RollHistoryList);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RollHistoryList] }).compileComponents();
    rollHistory = TestBed.inject(RollHistoryService);
    rollHistory.clear();
  });

  it('shows an empty state when there are no saved rolls', () => {
    createComponent();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'No saved rolls yet. Make an action, progress, or oracle roll to start the history.',
    );
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.history-entry')).toHaveLength(
      0,
    );
  });

  it('renders one saved action roll with label, dice, score, result, and match state', () => {
    rollHistory.saveActionRoll({
      prepared: preparedInput({ label: 'Secure the ford' }),
      result: resolvedRoll({
        actionDie: 6,
        challengeDice: [5, 5],
        cappedScore: 10,
        outcome: 'strong_hit',
        isMatch: true,
      }),
      createdAt: '2026-07-09T00:00:00.000Z',
    });
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('Secure the ford');
    expect(text).toContain('Strong hit');
    expect(text).toContain('6');
    expect(text).toContain('5 / 5');
    expect(text).toContain('10');
    expect(text).toContain('Match');
    expect(compiled.querySelector('[aria-label="Action die: 6"]')).toBeTruthy();
    expect(compiled.querySelector('[aria-label="Challenge dice: 5 and 5"]')).toBeTruthy();
    expect(compiled.querySelector('[aria-label="Result: Strong hit"]')).toBeTruthy();
  });

  it('renders multiple action rolls newest first and marks the latest roll', () => {
    rollHistory.saveActionRoll({
      prepared: preparedInput({ label: 'First roll' }),
      result: resolvedRoll({ actionDie: 2, cappedScore: 6, outcome: 'miss' }),
      createdAt: '2026-07-09T00:00:00.000Z',
    });
    rollHistory.saveActionRoll({
      prepared: preparedInput({ label: 'Second roll' }),
      result: resolvedRoll({ actionDie: 6, cappedScore: 10, outcome: 'strong_hit' }),
      createdAt: '2026-07-09T00:01:00.000Z',
    });
    createComponent();

    const entries = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.history-entry'),
    );
    expect(entries).toHaveLength(2);
    expect(entries[0].textContent).toContain('Second roll');
    expect(entries[0].textContent).toContain('Latest');
    expect(entries[1].textContent).toContain('First roll');
  });

  it('renders oracle records from the same newest-first history collection', () => {
    const oracle: ResolvedOracleTableResult = {
      id: 'oracle:first:4:entry-high',
      tableId: 'oracle:first',
      tableName: 'First Table',
      tableKind: 'table',
      roll: 4,
      rollRange: { min: 1, max: 6 },
      entryId: 'entry-high',
      entryRange: { min: 4, max: 6 },
      text: 'Project-original fixture result',
      questionContext: 'Is the path safe?',
      provenance: {
        category: 'project_original',
        title: 'Fixture provenance',
        license: 'Project original',
        releaseStatus: 'allowed',
        reviewStatus: 'reviewed',
        reviewedForUse: true,
      },
      tableProvenance: {
        category: 'project_original',
        title: 'Fixture table provenance',
        license: 'Project original',
        releaseStatus: 'allowed',
        reviewStatus: 'reviewed',
        reviewedForUse: true,
      },
      timestamp: '2026-07-09T00:01:00.000Z',
      sourceType: 'project_original',
    };
    rollHistory.saveActionRoll({
      prepared: preparedInput({ label: 'First roll' }),
      result: resolvedRoll(),
      createdAt: '2026-07-09T00:00:00.000Z',
    });
    rollHistory.saveOracleRoll({ result: oracle, note: 'Use this answer soon.' });
    createComponent();

    const entries = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.history-entry'),
    );
    expect(entries).toHaveLength(2);
    expect(entries[0].textContent).toContain('oracle');
    expect(entries[0].textContent).toContain('First Table');
    expect(entries[0].textContent).toContain('Project-original fixture result');
    expect(entries[0].textContent).toContain('Is the path safe?');
    expect(entries[0].textContent).toContain('Use this answer soon.');
    expect(entries[1].textContent).toContain('action');
  });

  it('uses a compact order label when an action roll has no saved label', () => {
    rollHistory.saveActionRoll({
      prepared: preparedInput({ label: undefined }),
      result: resolvedRoll(),
      createdAt: '2026-07-09T00:00:00.000Z',
    });
    createComponent();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Action roll 1');
  });
});
