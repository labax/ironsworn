import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ActiveCharacterService } from '@app/domain/character';
import { ONBOARDING_REVIEW_COPY, OnboardingStateService } from '@app/domain/onboarding';
import {
  CHALLENGE_RANK_LABELS,
  PROGRESS_TRACK_TYPE_LABELS,
  type ChallengeRank,
  type ProgressTrack,
} from '@app/domain/progress';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import type { Vow } from '@app/domain/vows';

@Component({
  selector: 'app-onboarding-review',
  imports: [RouterLink],
  templateUrl: './onboarding-review.html',
  styleUrl: './onboarding-review.css',
})
export class OnboardingReview {
  private readonly activeCharacter = inject(ActiveCharacterService);
  private readonly workspace = inject(CampaignWorkspaceService);
  private readonly onboarding = inject(OnboardingStateService);
  private readonly router = inject(Router);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly errorPanel = viewChild<ElementRef<HTMLElement>>('errorPanel');

  protected readonly copy = ONBOARDING_REVIEW_COPY;
  protected readonly character = this.activeCharacter.activeCharacter;
  protected readonly vows = this.workspace.vows;
  protected readonly tracks = this.workspace.progressTracks;
  protected saving = false;
  protected completed = false;
  protected message = '';
  protected errors: readonly { section: string; message: string; path: string }[] = [];

  constructor() {
    queueMicrotask(() => this.heading()?.nativeElement.focus());
  }

  protected firstVow(): Vow | null {
    return this.vows().find((vow) => vow.status === 'active') ?? null;
  }

  protected linkedTrack(): ProgressTrack | null {
    const vow = this.firstVow();
    if (!vow?.progressTrackId) return null;
    return this.tracks().find((track) => track.id === vow.progressTrackId) ?? null;
  }

  protected rankLabel(rank: ChallengeRank): string {
    return CHALLENGE_RANK_LABELS[rank];
  }

  protected trackTypeLabel(track: ProgressTrack): string {
    return PROGRESS_TRACK_TYPE_LABELS[track.type];
  }

  protected async exitSetup(): Promise<void> {
    if (this.saving || this.completed) return;
    this.saving = true;
    await this.onboarding.exitSetup();
    await this.router.navigate(['/moves']);
  }

  protected async complete(): Promise<void> {
    if (this.saving || this.completed) return;
    this.saving = true;
    this.message = '';
    this.errors = [];

    const result = await this.onboarding.completeOnboardingTransaction();
    this.saving = false;
    if (!result.ok) {
      this.errors = result.errors.map((error) => ({
        section: error.section,
        message: error.message,
        path: error.section === 'character' ? '/character' : '/welcome/first-vow',
      }));
      this.message = result.message;
      queueMicrotask(() => this.errorPanel()?.nativeElement.focus());
      return;
    }

    this.completed = true;
    this.message = this.copy.success;
    await this.router.navigate(['/moves']);
  }
}
