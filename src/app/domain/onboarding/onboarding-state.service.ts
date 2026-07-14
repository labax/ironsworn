import { Injectable, inject } from '@angular/core';
import {
  LocalStorageAdapter,
  createSaveEnvelope,
  type LoadResult,
  type SaveResult,
} from '@app/core/storage';
import {
  ActiveCharacterService,
  isValidMomentum,
  isValidStats,
  isValidStatusTracks,
} from '@app/domain/character';
import { ApplicationAutosaveService } from '@app/domain/services/application-autosave.service';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { isChallengeRank, type ChallengeRank } from '@app/domain/progress';
import { validateProgressTrackForCommit } from '@app/domain/progress/progress-track.validation';
import { validateVowDetails } from '@app/domain/vows/vow.validation';
import type { ValidationError } from '@app/rules/validation';
import { environment } from '@environments/environment';

export const ONBOARDING_STATUS_STORAGE_KEY = 'ironsworn.onboardingStatus';

export type OnboardingStepId = 'welcome' | 'character' | 'first-vow' | 'review' | 'done';

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

export type OnboardingErrorKind = 'validation' | 'storage' | 'navigation' | 'unexpected';

export interface OnboardingSectionError {
  readonly section: 'character' | 'first vow' | 'progress track' | 'save' | 'navigation';
  readonly message: string;
  readonly kind: OnboardingErrorKind;
  readonly field?: string;
}

export interface OnboardingStatus {
  readonly welcomeCompletedAt?: string;
  readonly skippedAt?: string;
  readonly inProgressAt?: string;
  readonly completedAt?: string;
  readonly firstVowCompletedAt?: string;
  readonly firstVowId?: string;
}

export type OnboardingGateDecision = 'show-welcome' | 'bypass-onboarding';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: 'welcome', path: '/welcome' },
  { id: 'character', path: '/character' },
  { id: 'first-vow', path: '/welcome/first-vow' },
  { id: 'review', path: '/welcome/review' },
  { id: 'done', path: '/moves' },
] as const;

@Injectable({ providedIn: 'root' })
export class OnboardingStateService {
  private readonly storage = inject(LocalStorageAdapter);
  private readonly autosave = inject(ApplicationAutosaveService);
  private readonly activeCharacter = inject(ActiveCharacterService);
  private readonly workspace = inject(CampaignWorkspaceService);
  private firstVowDraftState: FirstVowOnboardingDraft | null = null;
  private firstVowCommittedIdState: string | null = null;

  async getGateDecision(): Promise<OnboardingGateDecision> {
    const onboarding = await this.loadStatus();
    if (onboarding?.completedAt) return 'bypass-onboarding';
    return 'show-welcome';
  }

  async isInProgress(): Promise<boolean> {
    const onboarding = await this.loadStatus();
    return Boolean(onboarding?.inProgressAt && !onboarding.completedAt);
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
    const current = (await this.loadStatus()) ?? {};
    return this.saveStatus({
      ...current,
      welcomeCompletedAt: current.welcomeCompletedAt ?? new Date().toISOString(),
      inProgressAt: current.inProgressAt ?? new Date().toISOString(),
    });
  }

  async skipForNow(): Promise<SaveResult> {
    const current = (await this.loadStatus()) ?? {};
    return this.saveStatus({
      ...current,
      skippedAt: current.skippedAt ?? new Date().toISOString(),
    });
  }

  async exitSetup(): Promise<SaveResult> {
    const current = (await this.loadStatus()) ?? {};
    return this.saveStatus({
      ...current,
      inProgressAt: current.inProgressAt ?? new Date().toISOString(),
      skippedAt: new Date().toISOString(),
    });
  }

  clearFirstVowDraft(): void {
    this.firstVowDraftState = null;
  }

  async completeFirstVow(vowId: string): Promise<SaveResult> {
    const current = (await this.loadStatus()) ?? {};
    return this.saveStatus({
      ...current,
      firstVowId: vowId,
      firstVowCompletedAt: new Date().toISOString(),
    });
  }

  validateFirstVowDraft(
    draft: FirstVowOnboardingDraft,
  ): { readonly ok: true } | { readonly ok: false; readonly errors: readonly ValidationError[] } {
    const result = validateVowDetails({ ...draft, status: 'active' });
    return result.ok ? { ok: true } : { ok: false, errors: result.errors };
  }

  async completeOnboardingTransaction(): Promise<
    | { readonly ok: true }
    | {
        readonly ok: false;
        readonly message: string;
        readonly errors: readonly OnboardingSectionError[];
      }
  > {
    const validation = this.validateCompleteOnboardingState();
    if (validation.length) {
      return {
        ok: false,
        message: 'Complete the highlighted setup sections, then try again.',
        errors: validation,
      };
    }

    const flush = await this.autosave.flush();
    if (!flush.success) {
      return {
        ok: false,
        message: 'Setup could not be saved. Your review is still here; fix storage and try again.',
        errors: [
          {
            section: 'save',
            kind: storageErrorKind(flush.error.code),
            message: flush.error.message,
          },
        ],
      };
    }

    const current = (await this.loadStatus()) ?? {};
    if (current.completedAt) return { ok: true };
    const vow = this.firstVowCommittedIdState
      ? this.workspace.vows().find((candidate) => candidate.id === this.firstVowCommittedIdState)
      : this.workspace.vows().find((candidate) => candidate.status === 'active');
    if (!vow) {
      return {
        ok: false,
        message: 'Complete the highlighted setup sections, then try again.',
        errors: [
          {
            section: 'first vow',
            kind: 'validation',
            message: 'Create a first vow before finishing setup.',
          },
        ],
      };
    }
    const statusSave = await this.saveStatus({
      ...current,
      welcomeCompletedAt: current.welcomeCompletedAt ?? new Date().toISOString(),
      firstVowId: vow.id,
      firstVowCompletedAt: current.firstVowCompletedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    if (!statusSave.success) {
      return {
        ok: false,
        message: 'Setup saved, but completion status could not be recorded. Try again.',
        errors: [
          {
            section: 'save',
            kind: storageErrorKind(statusSave.error.code),
            message: statusSave.error.message,
          },
        ],
      };
    }
    return { ok: true };
  }

  validateCompleteOnboardingState(): readonly OnboardingSectionError[] {
    const errors: OnboardingSectionError[] = [];
    const validation = (
      section: OnboardingSectionError['section'],
      message: string,
      field?: string,
    ): OnboardingSectionError => ({
      section,
      kind: 'validation',
      message,
      field,
    });
    const character = this.activeCharacter.activeCharacter();
    if (!character)
      errors.push(validation('character', 'Create a character before finishing setup.'));
    else {
      if (!character.name.trim())
        errors.push(validation('character', 'Character needs a name.', 'name'));
      if (!isValidStats(character.stats))
        errors.push(
          validation(
            'character',
            'Character stats must use supported whole-number values.',
            'stats',
          ),
        );
      if (!isValidStatusTracks(character.statusTracks))
        errors.push(
          validation(
            'character',
            'Health, Spirit, and Supply must be supported values.',
            'statusTracks',
          ),
        );
      if (!isValidMomentum(character.momentum))
        errors.push(
          validation('character', 'Momentum must be within the supported range.', 'momentum'),
        );
    }

    const activeVows = this.workspace.vows().filter((vow) => vow.status === 'active');
    const vow = this.firstVowCommittedIdState
      ? activeVows.find((candidate) => candidate.id === this.firstVowCommittedIdState)
      : activeVows[0];
    if (!vow) errors.push(validation('first vow', 'Create a first vow before finishing setup.'));
    else {
      if (!vow.title.trim())
        errors.push(validation('first vow', 'First vow needs a title.', 'title'));
      if (!isChallengeRank(vow.rank))
        errors.push(validation('first vow', 'First vow rank is not supported.', 'rank'));
      if (!vow.progressTrackId)
        errors.push(
          validation(
            'progress track',
            'First vow must be linked to one progress track.',
            'progressTrackId',
          ),
        );
    }

    const track = vow?.progressTrackId
      ? this.workspace.progressTracks().find((candidate) => candidate.id === vow.progressTrackId)
      : null;
    if (vow?.progressTrackId && !track)
      errors.push(
        validation(
          'progress track',
          'The linked vow progress track is missing.',
          'progressTrackId',
        ),
      );
    if (vow && track) {
      if (track.type !== 'vow')
        errors.push(
          validation('progress track', 'The linked progress track must be a vow track.', 'type'),
        );
      if (track.rank !== vow.rank)
        errors.push(
          validation(
            'progress track',
            'The linked progress track rank must match the vow.',
            'rank',
          ),
        );
      const trackValidation = validateProgressTrackForCommit(track);
      if (!trackValidation.ok)
        trackValidation.errors.forEach((error) =>
          errors.push(validation('progress track', error.message, error.field)),
        );
      const duplicateLinks = this.workspace
        .vows()
        .filter((candidate) => candidate.progressTrackId === track.id);
      if (duplicateLinks.length !== 1)
        errors.push(
          validation(
            'progress track',
            'The linked progress track must belong to exactly one vow.',
            'progressTrackId',
          ),
        );
    }
    return errors;
  }

  private saveStatus(status: OnboardingStatus): Promise<SaveResult> {
    return this.storage.save(
      ONBOARDING_STATUS_STORAGE_KEY,
      createSaveEnvelope<OnboardingStatus>(status, {
        appVersion: environment.appVersion,
        metadata: { namespace: ONBOARDING_STATUS_STORAGE_KEY, contentType: 'onboarding-status' },
      }),
    );
  }

  async loadStatus(): Promise<OnboardingStatus | null> {
    const result: LoadResult<unknown> = await this.storage.load(ONBOARDING_STATUS_STORAGE_KEY);
    if (!result.success || !result.found) return null;
    return isOnboardingStatus(result.data.payload) ? result.data.payload : null;
  }
}

const isOnboardingStatus = (value: unknown): value is OnboardingStatus => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const status = value as OnboardingStatus;
  return (
    (status.completedAt === undefined || typeof status.completedAt === 'string') &&
    (status.skippedAt === undefined || typeof status.skippedAt === 'string') &&
    (status.inProgressAt === undefined || typeof status.inProgressAt === 'string') &&
    (status.welcomeCompletedAt === undefined || typeof status.welcomeCompletedAt === 'string') &&
    (status.firstVowCompletedAt === undefined || typeof status.firstVowCompletedAt === 'string') &&
    (status.firstVowId === undefined || typeof status.firstVowId === 'string')
  );
};

const storageErrorKind = (code: string): OnboardingErrorKind =>
  code === 'migration-failed' || code === 'malformed-data' ? 'storage' : 'storage';
