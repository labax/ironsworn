import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ONBOARDING_EXIT_COPY,
  ONBOARDING_FIRST_VOW_COPY,
  OnboardingStateService,
} from '@app/domain/onboarding';
import {
  CHALLENGE_RANK_LABELS,
  CHALLENGE_RANKS,
  PROGRESS_TRACK_TYPE_LABELS,
  type ChallengeRank,
} from '@app/domain/progress';
import type { ProgressTrack } from '@app/domain/progress';
import type { Vow } from '@app/domain/vows';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import type { ValidationError } from '@app/rules/validation';

interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface FirstVowReview {
  readonly vow: Vow;
  readonly track: ProgressTrack;
}

@Component({
  selector: 'app-onboarding-first-vow',
  imports: [ReactiveFormsModule],
  templateUrl: './onboarding-first-vow.html',
  styleUrl: './onboarding-first-vow.css',
})
export class OnboardingFirstVow {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly workspace = inject(CampaignWorkspaceService);
  private readonly onboarding = inject(OnboardingStateService);
  private readonly router = inject(Router);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');
  private readonly exitButton = viewChild<ElementRef<HTMLButtonElement>>('exitButton');
  private readonly cancelExitButton = viewChild<ElementRef<HTMLButtonElement>>('cancelExitButton');
  private readonly reviewPanel = viewChild<ElementRef<HTMLElement>>('reviewPanel');

  protected readonly copy = ONBOARDING_FIRST_VOW_COPY;
  protected readonly exitCopy = ONBOARDING_EXIT_COPY;
  protected readonly rankOptions: readonly SelectOption<ChallengeRank>[] = CHALLENGE_RANKS.map(
    (rank) => ({ value: rank, label: CHALLENGE_RANK_LABELS[rank] }),
  );
  protected readonly vowForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
    rank: ['troublesome' as ChallengeRank, [Validators.required]],
    notes: [''],
  });
  protected fieldErrors: Partial<Record<'title' | 'rank', string>> = {};
  protected formMessage = '';
  protected formMessageTone: 'status' | 'alert' = 'status';
  protected saving = false;
  protected review: FirstVowReview | null = null;
  protected exitConfirmOpen = false;
  protected exiting = false;

  constructor() {
    const draft = this.onboarding.firstVowDraft();
    if (draft) this.vowForm.reset(draft);
    queueMicrotask(() => this.titleInput()?.nativeElement.focus());
  }

  protected persistDraft(): void {
    this.onboarding.updateFirstVowDraft(this.vowForm.getRawValue());
  }

  protected hasDirtyDraft(): boolean {
    return !this.review && this.vowForm.dirty;
  }

  protected async back(): Promise<void> {
    this.persistDraft();
    await this.router.navigate([this.onboarding.previousStep('first-vow').path]);
  }

  protected async continue(): Promise<void> {
    if (this.saving || this.exiting) return;
    this.fieldErrors = {};
    this.formMessage = '';
    this.formMessageTone = 'status';

    if (this.review) {
      await this.router.navigate([this.onboarding.nextStep('first-vow').path]);
      return;
    }

    this.persistDraft();
    if (this.vowForm.invalid) this.vowForm.markAllAsTouched();

    const draft = this.vowForm.getRawValue();
    const existingId = this.onboarding.firstVowCommittedId();
    if (existingId) {
      await this.prepareReview(existingId);
      return;
    }
    if (this.vowForm.invalid) {
      this.applyErrors([{ code: 'required', field: 'title', message: 'Enter a vow title.' }]);
      return;
    }

    this.saving = true;
    const vowResult = this.workspace.saveVow({ ...draft, status: 'active' });
    if (!vowResult.ok) {
      this.saving = false;
      this.applyErrors(vowResult.errors);
      return;
    }

    const trackResult = this.workspace.createProgressTrackForVow({ vowId: vowResult.vow.id });
    this.saving = false;
    if (!trackResult.ok) {
      this.workspace.deleteVow(vowResult.vow.id);
      this.applyErrors(trackResult.errors);
      this.formMessage =
        'Setup could not link the vow to a progress track. Nothing was saved; try again.';
      this.formMessageTone = 'alert';
      return;
    }

    this.onboarding.markFirstVowCommitted(trackResult.vow.id);
    this.setReview(trackResult);
  }

  protected async exitSetup(): Promise<void> {
    if (this.saving || this.exiting) return;
    if (this.hasDirtyDraft()) {
      this.exitConfirmOpen = true;
      queueMicrotask(() => this.cancelExitButton()?.nativeElement.focus());
      return;
    }
    await this.finishExit(false);
  }

  protected cancelExit(): void {
    this.exitConfirmOpen = false;
    queueMicrotask(() => this.exitButton()?.nativeElement.focus());
  }

  protected async confirmExitDiscard(): Promise<void> {
    if (this.exiting) return;
    await this.finishExit(true);
  }

  protected trackTypeLabel(track: ProgressTrack): string {
    return PROGRESS_TRACK_TYPE_LABELS[track.type];
  }

  protected rankLabel(rank: ChallengeRank): string {
    return CHALLENGE_RANK_LABELS[rank];
  }

  protected showError(controlName: 'title' | 'rank'): boolean {
    const control = this.vowForm.controls[controlName];
    return (
      Boolean(this.fieldErrors[controlName]) ||
      (control.invalid && (control.touched || control.dirty))
    );
  }

  private async finishExit(discardDraft: boolean): Promise<void> {
    this.exiting = true;
    if (discardDraft) this.onboarding.clearFirstVowDraft();
    await this.onboarding.exitSetup();
    await this.router.navigate(['/moves']);
  }

  private async prepareReview(vowId: string): Promise<void> {
    this.saving = true;
    const result = this.workspace.createProgressTrackForVow({ vowId });
    this.saving = false;
    if (!result.ok) {
      this.applyErrors(result.errors);
      return;
    }
    this.setReview(result);
  }

  private setReview(review: FirstVowReview): void {
    this.review = review;
    this.vowForm.disable({ emitEvent: false });
    this.formMessage =
      'Review the vow and linked progress track, then continue. You can change progress during play.';
    this.formMessageTone = 'status';
    queueMicrotask(() => this.reviewPanel()?.nativeElement.focus());
  }

  private async finish(vowId: string): Promise<void> {
    const result = await this.onboarding.completeFirstVow(vowId);
    if (!result.success) {
      this.formMessage =
        'Your vow was saved, but setup status could not be updated. Try Continue again.';
      return;
    }
    await this.router.navigate([this.onboarding.nextStep('first-vow').path]);
  }

  private applyErrors(errors: readonly ValidationError[]): void {
    this.fieldErrors = Object.fromEntries(
      errors
        .filter((error) => error.field === 'title' || error.field === 'rank')
        .map((error) => [error.field, error.message]),
    );
    this.formMessage = errors[0]?.message ?? 'Check the highlighted fields.';
    this.formMessageTone = 'alert';
    const first = errors[0]?.field === 'rank' ? 'vow-rank' : 'vow-title';
    queueMicrotask(() => document.getElementById(first)?.focus());
  }
}
