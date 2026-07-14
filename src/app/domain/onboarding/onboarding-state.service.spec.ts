import { TestBed } from '@angular/core/testing';
import { BROWSER_STORAGE, createSaveEnvelope, type BrowserStorageLike } from '@app/core/storage';
import { createMinimalCharacterFixture } from '@app/domain/character';
import {
  ACTIVE_CHARACTER_STORAGE_KEY,
  toPersistedActiveCharacter,
} from '@app/domain/character/active-character-persistence.service';
import {
  APPLICATION_STATE_STORAGE_KEY,
  type ApplicationStateSnapshot,
} from '@app/domain/services/application-autosave.service';
import {
  CAMPAIGN_WORKSPACE_STORAGE_KEY,
  toPersistedCampaignWorkspace,
} from '@app/domain/services/campaign-workspace-persistence.service';
import { createDefaultProgressTrack } from '@app/domain/progress';
import { OnboardingStateService, ONBOARDING_STATUS_STORAGE_KEY } from './onboarding-state.service';

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

const savedAt = '2026-07-14T00:00:00.000Z';

const setup = (storage = new MemoryStorage()) => {
  TestBed.configureTestingModule({ providers: [{ provide: BROWSER_STORAGE, useValue: storage }] });
  return { storage, service: TestBed.inject(OnboardingStateService) };
};

const writeEnvelope = (storage: MemoryStorage, key: string, payload: unknown): void => {
  storage.setItem(
    key,
    JSON.stringify(createSaveEnvelope(payload, { appVersion: 'test', savedAt })),
  );
};

describe('OnboardingStateService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('shows the welcome for a true first run with no saved state', async () => {
    const { service } = setup();
    await expect(service.getGateDecision()).resolves.toBe('show-welcome');
  });

  it('bypasses onboarding for completed onboarding state', async () => {
    const { service, storage } = setup();
    writeEnvelope(storage, ONBOARDING_STATUS_STORAGE_KEY, { welcomeCompletedAt: savedAt });
    await expect(service.getGateDecision()).resolves.toBe('bypass-onboarding');
  });

  it('bypasses onboarding for a valid active character save', async () => {
    const { service, storage } = setup();
    writeEnvelope(
      storage,
      ACTIVE_CHARACTER_STORAGE_KEY,
      toPersistedActiveCharacter(createMinimalCharacterFixture()),
    );
    await expect(service.getGateDecision()).resolves.toBe('bypass-onboarding');
  });

  it('bypasses onboarding for a valid application snapshot', async () => {
    const { service, storage } = setup();
    const snapshot: ApplicationStateSnapshot = {
      revision: 4,
      character: createMinimalCharacterFixture(),
      workspace: null,
      rollHistory: [],
    };
    writeEnvelope(storage, APPLICATION_STATE_STORAGE_KEY, snapshot);
    await expect(service.getGateDecision()).resolves.toBe('bypass-onboarding');
  });

  it('bypasses onboarding for a valid workspace save', async () => {
    const { service, storage } = setup();
    writeEnvelope(
      storage,
      CAMPAIGN_WORKSPACE_STORAGE_KEY,
      toPersistedCampaignWorkspace({
        progressTracks: [
          createDefaultProgressTrack({
            id: 'track-1',
            title: 'Project-original test track',
            type: 'vow',
            rank: 'troublesome',
            createdAt: savedAt,
          }),
        ],
      }),
    );
    await expect(service.getGateDecision()).resolves.toBe('bypass-onboarding');
  });

  it('treats corrupt onboarding and play-state records as missing instead of completing onboarding', async () => {
    const { service, storage } = setup();
    storage.setItem(ONBOARDING_STATUS_STORAGE_KEY, '{broken');
    storage.setItem(ACTIVE_CHARACTER_STORAGE_KEY, '{broken');
    storage.setItem(APPLICATION_STATE_STORAGE_KEY, '{broken');
    storage.setItem(CAMPAIGN_WORKSPACE_STORAGE_KEY, '{broken');
    await expect(service.getGateDecision()).resolves.toBe('show-welcome');
  });

  it('stores onboarding completion separately from domain entities', async () => {
    const { service, storage } = setup();
    await expect(service.completeWelcome()).resolves.toEqual({ success: true });
    expect(storage.getItem(ONBOARDING_STATUS_STORAGE_KEY)).toBeTruthy();
    expect(storage.getItem(ACTIVE_CHARACTER_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(CAMPAIGN_WORKSPACE_STORAGE_KEY)).toBeNull();
  });
});
