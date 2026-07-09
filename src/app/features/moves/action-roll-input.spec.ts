import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveCharacterService, createDefaultCharacter } from '@app/domain/character';
import type { PreparedActionRollInput } from '@app/domain/rolls';
import type { ActionRollResult, RulesResult } from '@app/rules';

import {
  ACTION_ROLL_RESOLVER,
  ActionRollInput,
  type ActionRollResolver,
} from './action-roll-input';

describe('ActionRollInput', () => {
  let fixture: ComponentFixture<ActionRollInput>;
  let component: ActionRollInput;
  let activeCharacter: ActiveCharacterService;
  let resolverResult: RulesResult<ActionRollResult>;
  let resolverInputs: Parameters<ActionRollResolver>[0][];

  const resolvedRoll = (overrides: Partial<ActionRollResult> = {}): ActionRollResult => ({
    actionDie: 4,
    challengeDice: [3, 7],
    statBonus: 2,
    adds: 1,
    rawScore: 7,
    cappedScore: 7,
    outcome: 'weak_hit',
    challengeResults: [true, false],
    isMatch: false,
    trace: ['test trace'],
    ...overrides,
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(ActionRollInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    resolverResult = { ok: true, value: resolvedRoll() };
    resolverInputs = [];
    await TestBed.configureTestingModule({
      imports: [ActionRollInput],
      providers: [
        {
          provide: ACTION_ROLL_RESOLVER,
          useValue: ((input) => {
            resolverInputs.push(input);
            return resolverResult;
          }) satisfies ActionRollResolver,
        },
      ],
    }).compileComponents();
    activeCharacter = TestBed.inject(ActiveCharacterService);
    activeCharacter.clearActiveCharacter();
  });

  it('renders manual fallback when there is no active character', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No active character. Use manual values.');
    expect(compiled.querySelector('input#stat-value')).toBeTruthy();
    expect(component['rollForm'].controls.source.value).toBe('manual');
  });

  it('allows selecting an active character stat', () => {
    activeCharacter.setActiveCharacter(
      createDefaultCharacter({
        id: 'character-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        name: 'Kara',
      }),
    );
    activeCharacter.updateActiveCharacter({
      stats: { edge: 3, heart: 2, iron: 1, shadow: 1, wits: 2 },
    });
    createComponent();

    component['rollForm'].controls.statKey.setValue('heart');
    component['onStatSelectionChange']();
    component['prepareRoll']();

    expect(resolverInputs).toEqual([{ stat: 2, adds: 0 }]);
    expect(component['lastPreparedInput']()).toEqual({
      statKey: 'heart',
      statValue: 2,
      adds: 0,
      source: 'character-stat',
    });
  });

  it('emits a typed manual input with label and adds', () => {
    createComponent();
    const emitted: PreparedActionRollInput[] = [];
    component.prepared.subscribe((input) => emitted.push(input));

    component['rollForm'].setValue({
      label: 'Reach the ridge',
      source: 'manual',
      statKey: 'edge',
      statValue: 4,
      adds: -1,
    });
    component['prepareRoll']();

    expect(emitted).toEqual([
      {
        label: 'Reach the ridge',
        statValue: 4,
        adds: -1,
        source: 'manual',
      },
    ]);
    expect(resolverInputs).toEqual([{ stat: 4, adds: -1 }]);
  });

  it('displays resolved dice, inputs, score, result, and match state', () => {
    resolverResult = {
      ok: true,
      value: resolvedRoll({
        actionDie: 6,
        challengeDice: [5, 5],
        statBonus: 3,
        adds: 2,
        rawScore: 11,
        cappedScore: 10,
        outcome: 'strong_hit',
        challengeResults: [true, true],
        isMatch: true,
      }),
    };
    createComponent();

    component['rollForm'].patchValue({ statValue: 3, adds: 2 });
    component['prepareRoll']();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Strong hit');
    expect(text).toContain('6');
    expect(text).toContain('5 / 5');
    expect(text).toContain('Challenge dice match');
    expect(text).toContain('Calculation: 6 + 3 + 2 = 11');
    expect(text).toContain('capped at 10');
  });

  it.each([
    ['strong_hit', 'Strong hit'],
    ['weak_hit', 'Weak hit'],
    ['miss', 'Miss'],
  ] as const)('displays %s classification', (outcome, label) => {
    resolverResult = { ok: true, value: resolvedRoll({ outcome }) };
    createComponent();

    component['prepareRoll']();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(label);
  });

  it('handles resolver validation errors without crashing', () => {
    resolverResult = {
      ok: false,
      errors: [{ code: 'out_of_range', field: 'actionDie', message: 'invalid action die' }],
    };
    createComponent();

    component['prepareRoll']();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('The roll could not be resolved.');
    expect(component['lastResolvedRoll']()).toBeNull();
  });

  it('shows validation feedback and does not submit invalid numeric input', () => {
    createComponent();
    component['rollForm'].patchValue({ statValue: 6, adds: 7 });
    component['prepareRoll']();
    fixture.detectChanges();

    expect(component['lastPreparedInput']()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Use a whole number from 0 to 5.',
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Use a whole number from -5 to 5.',
    );
  });
});
