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
import { isChallengeRank, isValidProgressTicks, type ChallengeRank } from '@app/domain/progress';
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

  async completeOnboardingTransaction(): Promise<
    | { readonly ok: true }
    | {
        readonly ok: false;
        readonly message: string;
        readonly errors: readonly {
          section: 'character' | 'first vow' | 'progress track' | 'save';
          message: string;
        }[];
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
        errors: [{ section: 'save', message: flush.error.message }],
      };
    }

    const current = (await this.loadStatus()) ?? {};
    if (current.completedAt) return { ok: true };
    const vow = this.workspace.vows().find((candidate) => candidate.status === 'active')!;
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
        errors: [{ section: 'save', message: statusSave.error.message }],
      };
    }
    return { ok: true };
  }

  validateCompleteOnboardingState(): readonly {
    section: 'character' | 'first vow' | 'progress track';
    message: string;
  }[] {
    const errors: { section: 'character' | 'first vow' | 'progress track'; message: string }[] = [];
    const character = this.activeCharacter.activeCharacter();
    if (!character)
      errors.push({ section: 'character', message: 'Create a character before finishing setup.' });
    else {
      if (!character.name.trim())
        errors.push({ section: 'character', message: 'Character needs a name.' });
      if (!isValidStats(character.stats))
        errors.push({
          section: 'character',
          message: 'Character stats must use supported whole-number values.',
        });
      if (!isValidStatusTracks(character.statusTracks))
        errors.push({
          section: 'character',
          message: 'Health, Spirit, and Supply must be supported values.',
        });
      if (!isValidMomentum(character.momentum))
        errors.push({
          section: 'character',
          message: 'Momentum must be within the supported range.',
        });
    }

    const activeVows = this.workspace.vows().filter((vow) => vow.status === 'active');
    const vow = activeVows[0];
    if (!vow)
      errors.push({ section: 'first vow', message: 'Create a first vow before finishing setup.' });
    else {
      if (!vow.title.trim())
        errors.push({ section: 'first vow', message: 'First vow needs a title.' });
      if (!isChallengeRank(vow.rank))
        errors.push({ section: 'first vow', message: 'First vow rank is not supported.' });
      if (!vow.progressTrackId)
        errors.push({
          section: 'progress track',
          message: 'First vow must be linked to one progress track.',
        });
    }

    const track = vow?.progressTrackId
      ? this.workspace.progressTracks().find((candidate) => candidate.id === vow.progressTrackId)
      : null;
    if (vow?.progressTrackId && !track)
      errors.push({
        section: 'progress track',
        message: 'The linked vow progress track is missing.',
      });
    if (vow && track) {
      if (track.type !== 'vow')
        errors.push({
          section: 'progress track',
          message: 'The linked progress track must be a vow track.',
        });
      if (track.rank !== vow.rank)
        errors.push({
          section: 'progress track',
          message: 'The linked progress track rank must match the vow.',
        });
      if (!isValidProgressTicks(track.ticks))
        errors.push({
          section: 'progress track',
          message: 'The linked progress track has invalid progress.',
        });
      const duplicateLinks = this.workspace
        .vows()
        .filter((candidate) => candidate.progressTrackId === track.id);
      if (duplicateLinks.length !== 1)
        errors.push({
          section: 'progress track',
          message: 'The linked progress track must belong to exactly one vow.',
        });
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
