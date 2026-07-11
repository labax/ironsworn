import { TestBed } from '@angular/core/testing';

import { BROWSER_STORAGE, type BrowserStorageLike } from '@app/core/storage';
import { ActiveCharacterService, createMinimalCharacterFixture } from '@app/domain/character';
import { previewActionRollMomentumBurn, type ActionRollResult } from '@app/rules';
import type { PreparedActionRollInput } from './action-roll-input';
import { MomentumBurnApplicationService } from './momentum-burn-application.service';
import { RollHistoryService } from './roll-history.service';

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

const prepared: PreparedActionRollInput = {
  label: 'Test roll',
  statValue: 1,
  adds: 0,
  source: 'manual',
};
const roll = (overrides: Partial<ActionRollResult> = {}): ActionRollResult => ({
  actionDie: 3,
  challengeDice: [5, 8],
  statBonus: 1,
  adds: 0,
  rawScore: 4,
  cappedScore: 4,
  outcome: 'miss',
  challengeResults: [false, false],
  isMatch: false,
  trace: ['test'],
  ...overrides,
});

describe('MomentumBurnApplicationService', () => {
  let service: MomentumBurnApplicationService;
  let activeCharacter: ActiveCharacterService;
  let history: RollHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useClass: MemoryStorage }],
    });
    service = TestBed.inject(MomentumBurnApplicationService);
    activeCharacter = TestBed.inject(ActiveCharacterService);
    history = TestBed.inject(RollHistoryService);
    history.clear();
    activeCharacter.setActiveCharacter(
      createMinimalCharacterFixture({
        momentum: { current: 6, reset: 2, max: 10, hasOverride: false },
      }),
    );
  });

  it('applies a one-die burn, resets Momentum, and updates the same history record', async () => {
    const initial = roll();
    const preview = previewActionRollMomentumBurn(
      initial,
      activeCharacter.activeCharacter()!.momentum,
    );
    const entry = history.saveActionRoll({ prepared, result: initial });

    const result = await service.apply({
      roll: initial,
      preview: preview.ok ? preview.value : null!,
      prepared,
      historyEntryId: entry.id,
    });

    expect(result.success).toBe(true);
    expect(activeCharacter.activeCharacter()?.momentum.current).toBe(2);
    expect(history.entries()).toHaveLength(1);
    expect(history.entries()[0]).toMatchObject({
      id: entry.id,
      outcome: 'weak_hit',
      isMatch: false,
      actionRoll: { challengeDice: [5, 8], actionScore: 4 },
      momentumBurn: {
        applied: true,
        canceledDice: [{ position: 0, value: 5 }],
        momentumUsed: 6,
        resetValue: 2,
        initialOutcome: 'miss',
        finalOutcome: 'weak_hit',
        originalMatch: false,
      },
    });
  });

  it('applies a two-die burn and preserves original match state', async () => {
    activeCharacter.setActiveCharacter(
      createMinimalCharacterFixture({
        momentum: { current: 8, reset: 2, max: 10, hasOverride: false },
      }),
    );
    const initial = roll({
      actionDie: 2,
      cappedScore: 3,
      rawScore: 3,
      challengeDice: [5, 7],
      isMatch: false,
    });
    const preview = previewActionRollMomentumBurn(
      initial,
      activeCharacter.activeCharacter()!.momentum,
    );

    const result = await service.apply({
      roll: initial,
      preview: preview.ok ? preview.value : null!,
      prepared,
    });

    expect(result.success).toBe(true);
    expect(history.entries()).toHaveLength(1);
    expect(history.entries()[0].momentumBurn).toMatchObject({
      canceledDice: [
        { position: 0, value: 5 },
        { position: 1, value: 7 },
      ],
      finalOutcome: 'strong_hit',
      originalMatch: false,
    });
  });

  it('rejects stale state and does not mutate Momentum or history', async () => {
    const initial = roll();
    const preview = previewActionRollMomentumBurn(
      initial,
      activeCharacter.activeCharacter()!.momentum,
    );
    activeCharacter.updateActiveCharacter({ momentum: { current: 5 } });

    const result = await service.apply({
      roll: initial,
      preview: preview.ok ? preview.value : null!,
      prepared,
    });

    expect(result.success).toBe(false);
    expect(activeCharacter.activeCharacter()?.momentum.current).toBe(5);
    expect(history.entries()).toHaveLength(0);
  });

  it('is idempotent for a finalized roll object', async () => {
    const initial = roll();
    const preview = previewActionRollMomentumBurn(
      initial,
      activeCharacter.activeCharacter()!.momentum,
    );
    const entry = history.saveActionRoll({ prepared, result: initial });

    await service.apply({
      roll: initial,
      preview: preview.ok ? preview.value : null!,
      prepared,
      historyEntryId: entry.id,
    });
    const second = await service.apply({
      roll: initial,
      preview: preview.ok ? preview.value : null!,
      prepared,
      historyEntryId: entry.id,
    });

    expect(second.success).toBe(true);
    expect(activeCharacter.activeCharacter()?.momentum.current).toBe(2);
    expect(history.entries()).toHaveLength(1);
  });
});
