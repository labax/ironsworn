import { TestBed } from '@angular/core/testing';
import { BROWSER_STORAGE, createSaveEnvelope } from '@app/core/storage';
import { ActiveCharacterService, createDefaultCharacter } from '@app/domain/character';
import { CharacterDraftService } from '@app/domain/character/character-draft.service';
import { OnboardingStateService, ONBOARDING_STATUS_STORAGE_KEY } from '@app/domain/onboarding';
import { RollHistoryService, ROLL_HISTORY_STORAGE_KEY } from '@app/domain/rolls';
import { ApplicationAutosaveService } from '@app/domain/services/application-autosave.service';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { APPLICATION_OWNED_STORAGE_KEY_VALUES } from './application-storage-keys';
import { ApplicationResetService } from './application-reset.service';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  length = 0;
  clear(): void {
    this.values.clear();
    this.length = 0;
  }
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.values.delete(key);
    this.length = this.values.size;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
    this.length = this.values.size;
  }
}

const configure = (storage = new MemoryStorage()) => {
  TestBed.configureTestingModule({ providers: [{ provide: BROWSER_STORAGE, useValue: storage }] });
  TestBed.inject(CharacterDraftService);
  TestBed.inject(CampaignWorkspaceService);
  TestBed.inject(RollHistoryService);
  const autosave = TestBed.inject(ApplicationAutosaveService);
  autosave.markInitialized();
  return {
    storage,
    reset: TestBed.inject(ApplicationResetService),
    autosave,
    activeCharacter: TestBed.inject(ActiveCharacterService),
    workspace: TestBed.inject(CampaignWorkspaceService),
    rollHistory: TestBed.inject(RollHistoryService),
    onboarding: TestBed.inject(OnboardingStateService),
  };
};

describe('ApplicationResetService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('registers every current application-owned local storage key in one auditable list', () => {
    expect(APPLICATION_OWNED_STORAGE_KEY_VALUES).toEqual([
      'ironsworn.applicationState',
      'ironsworn.activeCharacter',
      'ironsworn.campaignWorkspace',
      'ironsworn.rollHistory',
      'ironsworn.onboardingStatus',
    ]);
  });

  it('removes only registered Ironsworn keys, preserves unrelated keys, clears memory, and restarts onboarding state', async () => {
    const { storage, reset, activeCharacter, workspace, rollHistory, onboarding } = configure();
    for (const key of APPLICATION_OWNED_STORAGE_KEY_VALUES) {
      storage.setItem(
        key,
        JSON.stringify(createSaveEnvelope({ ok: true }, { appVersion: 'test' })),
      );
    }
    storage.setItem('unrelated.sameOrigin', 'keep');
    activeCharacter.setActiveCharacter(
      createDefaultCharacter({
        id: 'character-1',
        name: 'Ash',
        createdAt: '2026-07-14T00:00:00.000Z',
      }),
    );
    workspace.saveVow({ title: 'Swear a vow', rank: 'troublesome', status: 'active' });
    rollHistory.restoreEntries([
      {
        id: 'roll-history-1',
        schemaVersion: 1,
        recordStatus: 'active',
        createdAt: '2026-07-14T00:00:00.000Z',
        updatedAt: '2026-07-14T00:00:00.000Z',
        type: 'action',
        source: 'manual',
        outcome: 'weak_hit',
        isMatch: false,
      },
    ]);
    onboarding.updateFirstVowDraft({
      title: 'Draft',
      description: '',
      rank: 'troublesome',
      notes: '',
    });
    onboarding.markFirstVowCommitted('vow-1');

    const result = await reset.resetApplication();

    expect(result.ok).toBe(true);
    for (const key of APPLICATION_OWNED_STORAGE_KEY_VALUES) expect(storage.getItem(key)).toBeNull();
    expect(storage.getItem('unrelated.sameOrigin')).toBe('keep');
    expect(activeCharacter.activeCharacter()).toBeNull();
    expect(workspace.vows()).toEqual([]);
    expect(workspace.progressTracks()).toEqual([]);
    expect(workspace.journalEntries()).toEqual([]);
    expect(workspace.customOracleTables()).toEqual([]);
    expect(rollHistory.entries()).toEqual([]);
    expect(onboarding.firstVowDraft()).toBeNull();
    expect(onboarding.firstVowCommittedId()).toBeNull();
    expect(await onboarding.getGateDecision()).toBe('show-welcome');
  });

  it('suppresses pending autosave so deleted storage is not recreated', async () => {
    const { storage, reset, activeCharacter, autosave } = configure();
    activeCharacter.setActiveCharacter(
      createDefaultCharacter({
        id: 'character-1',
        name: 'Ash',
        createdAt: '2026-07-14T00:00:00.000Z',
      }),
    );
    autosave.markCommittedChange('character');

    await reset.resetApplication();
    await new Promise((resolve) => setTimeout(resolve, 300));

    for (const key of APPLICATION_OWNED_STORAGE_KEY_VALUES) expect(storage.getItem(key)).toBeNull();
  });

  it('reports removal failure without claiming success', async () => {
    class FailingStorage extends MemoryStorage {
      override removeItem(key: string): void {
        if (key === ROLL_HISTORY_STORAGE_KEY) throw new Error('blocked');
        super.removeItem(key);
      }
    }
    const storage = new FailingStorage();
    storage.setItem(
      ROLL_HISTORY_STORAGE_KEY,
      JSON.stringify(createSaveEnvelope([], { appVersion: 'test' })),
    );
    storage.setItem(
      ONBOARDING_STATUS_STORAGE_KEY,
      JSON.stringify(createSaveEnvelope({ completedAt: 'x' }, { appVersion: 'test' })),
    );
    const { reset } = configure(storage);

    const result = await reset.resetApplication();

    expect(result.ok).toBe(false);
    expect(reset.status()).toBe('failed');
    expect(result.ok ? [] : result.failedKeys).toContain(ROLL_HISTORY_STORAGE_KEY);
  });

  it('prevents overlapping duplicate resets', async () => {
    const { reset } = configure();
    const first = reset.resetApplication();
    const second = await reset.resetApplication();
    await first;
    expect(second).toEqual({
      ok: false,
      message: 'Reset is already in progress. Wait for it to finish before trying again.',
      failedKeys: [],
    });
  });
});
