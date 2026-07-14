import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ONBOARDING_FIRST_VOW_COPY, OnboardingStateService } from '@app/domain/onboarding';
import { CHALLENGE_RANK_LABELS, CHALLENGE_RANKS, type ChallengeRank } from '@app/domain/progress';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import type { ValidationError } from '@app/rules/validation';

interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
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

  protected readonly copy = ONBOARDING_FIRST_VOW_COPY;
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
  protected saving = false;

  constructor() {
    const draft = this.onboarding.firstVowDraft();
    if (draft) this.vowForm.reset(draft);
    queueMicrotask(() => this.titleInput()?.nativeElement.focus());
  }

  protected persistDraft(): void {
    this.onboarding.updateFirstVowDraft(this.vowForm.getRawValue());
  }

  protected async back(): Promise<void> {
    this.persistDraft();
    await this.router.navigate([this.onboarding.previousStep('first-vow').path]);
  }

  protected async continue(): Promise<void> {
    if (this.saving) return;
    this.persistDraft();
    this.fieldErrors = {};
    this.formMessage = '';
    if (this.vowForm.invalid) this.vowForm.markAllAsTouched();

    const draft = this.vowForm.getRawValue();
    const existingId = this.onboarding.firstVowCommittedId();
    if (existingId) {
      await this.finish(existingId);
      return;
    }
    if (this.vowForm.invalid) {
      this.applyErrors([{ code: 'required', field: 'title', message: 'Enter a vow title.' }]);
      return;
    }

    this.saving = true;
    const result = this.workspace.saveVow({ ...draft, status: 'active' });
    this.saving = false;
    if (!result.ok) {
      this.applyErrors(result.errors);
      return;
    }
    this.onboarding.markFirstVowCommitted(result.vow.id);
    await this.finish(result.vow.id);
  }

  protected showError(controlName: 'title' | 'rank'): boolean {
    const control = this.vowForm.controls[controlName];
    return (
      Boolean(this.fieldErrors[controlName]) ||
      (control.invalid && (control.touched || control.dirty))
    );
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
    const first = errors[0]?.field === 'rank' ? 'vow-rank' : 'vow-title';
    document.getElementById(first)?.focus();
  }
}
