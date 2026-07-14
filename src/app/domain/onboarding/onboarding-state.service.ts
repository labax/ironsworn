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
import { environment } from '@environments/environment';

export const ONBOARDING_STATUS_STORAGE_KEY = 'ironsworn.onboardingStatus';

export interface OnboardingStatus {
  readonly welcomeCompletedAt?: string;
}

export type OnboardingGateDecision = 'show-welcome' | 'bypass-onboarding';

@Injectable({ providedIn: 'root' })
export class OnboardingStateService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly autosave = inject(ApplicationAutosaveService);
  private readonly characterPersistence = inject(ActiveCharacterPersistenceService);
  private readonly workspacePersistence = inject(CampaignWorkspacePersistenceService);

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
  const completedAt = (value as OnboardingStatus).welcomeCompletedAt;
  return completedAt === undefined || typeof completedAt === 'string';
};
