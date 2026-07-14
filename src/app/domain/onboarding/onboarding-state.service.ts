import { Injectable, inject } from '@angular/core';
import {
  LocalStorageAdapter,
  createSaveEnvelope,
  type LoadResult,
  type SaveResult,
} from '@app/core/storage';
import { ActiveCharacterPersistenceService } from '@app/domain/character';
import { ApplicationAutosaveService } from '@app/domain/services/application-autosave.service';
import { CampaignWorkspacePersistenceService } from '@app/domain/services/campaign-workspace-persistence.service';
import type { ChallengeRank } from '@app/domain/progress';
import { environment } from '@environments/environment';

export const ONBOARDING_STATUS_STORAGE_KEY = 'ironsworn.onboardingStatus';

export type OnboardingStepId = 'welcome' | 'character' | 'first-vow' | 'done';

export interface OnboardingStep {
  readonly id: OnboardingStepId;
  readonly path: string;
}

export interface FirstVowOnboardingDraft {
  readonly title: string;
  readonly description: string;
  readonly rank: ChallengeRank;
  readonly notes: string;
}

export interface OnboardingStatus {
  readonly welcomeCompletedAt?: string;
  readonly firstVowCompletedAt?: string;
  readonly firstVowId?: string;
}

export type OnboardingGateDecision = 'show-welcome' | 'bypass-onboarding';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: 'welcome', path: '/welcome' },
  { id: 'character', path: '/character' },
  { id: 'first-vow', path: '/welcome/first-vow' },
  { id: 'done', path: '/moves' },
] as const;

@Injectable({ providedIn: 'root' })
export class OnboardingStateService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly autosave = inject(ApplicationAutosaveService);
  private readonly characterPersistence = inject(ActiveCharacterPersistenceService);
  private readonly workspacePersistence = inject(CampaignWorkspacePersistenceService);
  private firstVowDraftState: FirstVowOnboardingDraft | null = null;
  private firstVowCommittedIdState: string | null = null;

  async getGateDecision(): Promise<OnboardingGateDecision> {
    const [onboarding, hasApplicationState, hasCharacter, hasWorkspace] = await Promise.all([
      this.loadStatus(),
      this.hasValidApplicationState(),
      this.hasValidCharacter(),
      this.hasValidWorkspace(),
    ]);

    if (onboarding?.welcomeCompletedAt || hasApplicationState || hasCharacter || hasWorkspace) {
      return 'bypass-onboarding';
    }
    return 'show-welcome';
  }

  step(id: OnboardingStepId): OnboardingStep {
    return ONBOARDING_STEPS.find((step) => step.id === id) ?? ONBOARDING_STEPS[0];
  }

  nextStep(id: OnboardingStepId): OnboardingStep {
    const index = ONBOARDING_STEPS.findIndex((step) => step.id === id);
    return ONBOARDING_STEPS[Math.min(ONBOARDING_STEPS.length - 1, Math.max(0, index) + 1)];
  }

  previousStep(id: OnboardingStepId): OnboardingStep {
    const index = ONBOARDING_STEPS.findIndex((step) => step.id === id);
    return ONBOARDING_STEPS[Math.max(0, index - 1)];
  }

  firstVowDraft(): FirstVowOnboardingDraft | null {
    return this.firstVowDraftState ? { ...this.firstVowDraftState } : null;
  }

  updateFirstVowDraft(draft: FirstVowOnboardingDraft): void {
    this.firstVowDraftState = { ...draft };
  }

  firstVowCommittedId(): string | null {
    return this.firstVowCommittedIdState;
  }

  markFirstVowCommitted(vowId: string): void {
    this.firstVowCommittedIdState = vowId;
  }

  async completeWelcome(): Promise<SaveResult> {
    return this.storage.save(
      ONBOARDING_STATUS_STORAGE_KEY,
      createSaveEnvelope<OnboardingStatus>(
        { welcomeCompletedAt: new Date().toISOString() },
        {
          appVersion: environment.appVersion,
          metadata: { namespace: ONBOARDING_STATUS_STORAGE_KEY, contentType: 'onboarding-status' },
        },
      ),
    );
  }

  async completeFirstVow(vowId: string): Promise<SaveResult> {
    const current = (await this.loadStatus()) ?? {};
    return this.storage.save(
      ONBOARDING_STATUS_STORAGE_KEY,
      createSaveEnvelope<OnboardingStatus>(
        { ...current, firstVowId: vowId, firstVowCompletedAt: new Date().toISOString() },
        {
          appVersion: environment.appVersion,
          metadata: { namespace: ONBOARDING_STATUS_STORAGE_KEY, contentType: 'onboarding-status' },
        },
      ),
    );
  }

  async loadStatus(): Promise<OnboardingStatus | null> {
    const result: LoadResult<unknown> = await this.storage.load(ONBOARDING_STATUS_STORAGE_KEY);
    if (!result.success || !result.found) return null;
    return isOnboardingStatus(result.data.payload) ? result.data.payload : null;
  }

  private async hasValidApplicationState(): Promise<boolean> {
    const result = await this.autosave.loadSavedSnapshot();
    return result.success && result.found;
  }

  private async hasValidCharacter(): Promise<boolean> {
    const result = await this.characterPersistence.loadActiveCharacter();
    return result.success && result.found;
  }

  private async hasValidWorkspace(): Promise<boolean> {
    const result = await this.workspacePersistence.loadWorkspace();
    return result.success && result.found;
  }
}

const isOnboardingStatus = (value: unknown): value is OnboardingStatus => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const status = value as OnboardingStatus;
  return (
    (status.welcomeCompletedAt === undefined || typeof status.welcomeCompletedAt === 'string') &&
    (status.firstVowCompletedAt === undefined || typeof status.firstVowCompletedAt === 'string') &&
    (status.firstVowId === undefined || typeof status.firstVowId === 'string')
  );
};
