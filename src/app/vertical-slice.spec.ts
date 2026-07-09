import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterDraftService } from '@app/domain/character';
import { RollHistoryService } from '@app/domain/rolls';
import type { ActionRollResult, RulesResult } from '@app/rules';
import { BROWSER_STORAGE, type BrowserStorageLike } from '@app/core/storage';
import { Character } from './features/character/character';
import {
  ACTION_ROLL_RESOLVER,
  ActionRollInput,
  type ActionRollResolver,
} from './features/moves/action-roll-input';
import { RollHistoryList } from './features/moves/roll-history-list';

class MemoryStorage implements BrowserStorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const deterministicActionRoll = (overrides: Partial<ActionRollResult> = {}): ActionRollResult => ({
  actionDie: 6,
  challengeDice: [4, 4],
  statBonus: 3,
  adds: 1,
  rawScore: 10,
  cappedScore: 10,
  outcome: 'strong_hit',
  challengeResults: [true, true],
  isMatch: true,
  trace: ['vertical slice deterministic test roll'],
  ...overrides,
});

describe('first vertical slice integration', () => {
  let characterFixture: ComponentFixture<Character>;
  let rollFixture: ComponentFixture<ActionRollInput>;
  let historyFixture: ComponentFixture<RollHistoryList>;
  let characterDraft: CharacterDraftService;
  let rollHistory: RollHistoryService;
  let resolverInputs: Parameters<ActionRollResolver>[0][];

  beforeEach(async () => {
    resolverInputs = [];

    await TestBed.configureTestingModule({
      imports: [Character, ActionRollInput, RollHistoryList],
      providers: [
        { provide: BROWSER_STORAGE, useValue: new MemoryStorage() },
        {
          provide: ACTION_ROLL_RESOLVER,
          useValue: ((input) => {
            resolverInputs.push(input);
            return {
              ok: true,
              value: deterministicActionRoll({
                statBonus: input.stat,
                adds: input.adds ?? 0,
                rawScore: 6 + input.stat + (input.adds ?? 0),
                cappedScore: Math.min(10, 6 + input.stat + (input.adds ?? 0)),
              }),
            } satisfies RulesResult<ActionRollResult>;
          }) satisfies ActionRollResolver,
        },
      ],
    }).compileComponents();

    characterDraft = TestBed.inject(CharacterDraftService);
    rollHistory = TestBed.inject(RollHistoryService);
    characterDraft.clear();
    rollHistory.clear();
  });

  it('saves a character, resolves a deterministic action roll, and displays the history entry', () => {
    characterFixture = TestBed.createComponent(Character);
    const characterComponent = characterFixture.componentInstance;
    characterFixture.detectChanges();

    characterComponent['characterForm'].setValue({
      name: 'Kara',
      concept: 'Original test scout',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
      health: 5,
      spirit: 5,
      supply: 5,
      momentum: 2,
    });
    characterComponent['saveCharacter']();
    characterFixture.detectChanges();

    expect(characterDraft.character()).toMatchObject({
      name: 'Kara',
      stats: { edge: 3 },
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: { current: 2 },
    });
    expect((characterFixture.nativeElement as HTMLElement).textContent).toContain('Kara is ready.');

    rollFixture = TestBed.createComponent(ActionRollInput);
    const rollComponent = rollFixture.componentInstance;
    rollFixture.detectChanges();

    rollComponent['rollForm'].patchValue({ label: 'Cross the ravine', statKey: 'edge', adds: 1 });
    rollComponent['onStatSelectionChange']();
    rollComponent['prepareRoll']();
    rollFixture.detectChanges();

    expect(resolverInputs).toEqual([{ stat: 3, adds: 1 }]);
    expect(rollHistory.entries()).toHaveLength(1);
    expect((rollFixture.nativeElement as HTMLElement).textContent).toContain('Strong hit');
    expect((rollFixture.nativeElement as HTMLElement).textContent).toContain(
      'Challenge dice match',
    );

    historyFixture = TestBed.createComponent(RollHistoryList);
    historyFixture.detectChanges();

    const historyText = (historyFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(historyText).toContain('Cross the ravine');
    expect(historyText).toContain('Strong hit');
    expect(historyText).toContain('Match');
  });
});
