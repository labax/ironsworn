import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveCharacterService, createDefaultCharacter } from '@app/domain/character';
import type { PreparedActionRollInput } from '@app/domain/rolls';

import { ActionRollInput } from './action-roll-input';

describe('ActionRollInput', () => {
  let fixture: ComponentFixture<ActionRollInput>;
  let component: ActionRollInput;
  let activeCharacter: ActiveCharacterService;

  const createComponent = () => {
    fixture = TestBed.createComponent(ActionRollInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActionRollInput] }).compileComponents();
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
