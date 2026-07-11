import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CHALLENGE_RANK_LABELS,
  CHALLENGE_RANKS,
  PROGRESS_TRACK_TYPE_LABELS,
  PROGRESS_TRACK_TYPES,
  type ChallengeRank,
  type ProgressTrack,
  type ProgressTrackStatus,
  type ProgressTrackType,
} from '@app/domain/progress';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import {
  addProgressByRank,
  correctProgressTicks,
  MAX_PROGRESS_TICKS,
  MIN_PROGRESS_TICKS,
  PROGRESS_TICKS_PER_BOX,
  progressRankIncrementTicks,
  progressScoreFromState,
  removeProgressByRank,
  type ProgressRollResult,
} from '@app/rules/progress-rolls';
import type { ValidationError } from '@app/rules/validation';

interface ProgressTrackListItem {
  readonly track: ProgressTrack;
  readonly title: string;
  readonly typeLabel: string;
  readonly statusLabel: string;
  readonly rankLabel: string | null;
  readonly progressLabel: string;
  readonly progressScoreLabel: string;
  readonly progressBoxes: readonly boolean[];
  readonly markDisabled: boolean;
  readonly unmarkDisabled: boolean;
  readonly markHelp: string;
  readonly unmarkHelp: string;
  readonly notes: string | null;
  readonly isManualOverride: boolean;
  readonly overrideStatusLabel: string;
  readonly rollDisabled: boolean;
  readonly linkedVowId?: string;
  readonly linkedVowSummary: string;
}

interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

const statusLabels: Record<ProgressTrackStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  failed: 'Failed',
  forsaken: 'Forsaken',
  archived: 'Archived',
};

@Component({
  selector: 'app-trackers',
  imports: [ReactiveFormsModule],
  templateUrl: './trackers.html',
  styleUrl: './trackers.css',
})
export class Trackers {
  private readonly workspace = inject(CampaignWorkspaceService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  protected readonly typeOptions: readonly SelectOption<ProgressTrackType>[] =
    PROGRESS_TRACK_TYPES.map((type) => ({ value: type, label: PROGRESS_TRACK_TYPE_LABELS[type] }));
  protected readonly rankOptions: readonly SelectOption<ChallengeRank>[] = CHALLENGE_RANKS.map(
    (rank) => ({ value: rank, label: CHALLENGE_RANK_LABELS[rank] }),
  );

  protected readonly selectedProgressTrackId = this.workspace.selectedProgressTrackId;
  protected readonly selectedTrack = this.workspace.selectedProgressTrack;
  protected readonly tracks = computed<readonly ProgressTrackListItem[]>(() => {
    const vows = this.workspace.vows();
    return this.workspace.progressTracks().map((track) =>
      this.toListItem(
        track,
        vows.find((vow) => vow.progressTrackId === track.id),
      ),
    );
  });

  protected readonly trackForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    type: ['vow' as ProgressTrackType, [Validators.required]],
    rank: ['troublesome' as ChallengeRank, [Validators.required]],
    notes: [''],
  });

  protected editingTrackId: string | null = null;
  protected formMessage = '';
  protected fieldErrors: Partial<Record<'title' | 'type' | 'rank' | 'ticks', string>> = {};
  protected correctionTicks = 0;
  protected progressMessage = '';
  protected latestProgressRoll: Readonly<ProgressRollResult> | null = null;

  constructor() {
    effect(() => {
      const selected = this.selectedTrack();
      if (!selected || selected.id === this.editingTrackId) return;
      this.loadTrack(selected);
    });
  }

  protected openCreate(): void {
    this.editingTrackId = null;
    this.trackForm.reset({ title: '', type: 'vow', rank: 'troublesome', notes: '' });
    this.fieldErrors = {};
    this.formMessage = 'Creating a new progress track.';
  }

  protected openTrack(trackId: string): void {
    const selected = this.workspace.selectProgressTrack(trackId);
    if (selected) this.loadTrack(selected);
  }

  protected openLinkedVow(vowId: string): void {
    this.workspace.selectVow(vowId);
    void this.router.navigate(['/vows']);
  }

  protected markProgress(track: ProgressTrack): void {
    const result = addProgressByRank({ ticks: track.ticks, rank: track.rank });
    if (!result.ok) {
      this.progressMessage = result.errors[0]?.message ?? 'Progress could not be marked.';
      return;
    }
    this.saveProgressTicks(track.id, result.value.ticks, 'Progress marked.');
  }

  protected unmarkProgress(track: ProgressTrack): void {
    const result = removeProgressByRank({ ticks: track.ticks, rank: track.rank });
    if (!result.ok) {
      this.progressMessage = result.errors[0]?.message ?? 'Progress could not be removed.';
      return;
    }
    this.saveProgressTicks(track.id, result.value.ticks, 'Progress removed.');
  }

  protected rollProgress(track: ProgressTrack): void {
    this.latestProgressRoll = null;
    const current = this.workspace.progressTracks().find((candidate) => candidate.id === track.id);
    if (
      !current ||
      current.updatedAt !== track.updatedAt ||
      !Object.is(current.ticks, track.ticks)
    ) {
      this.progressMessage = 'Progress roll unavailable because this track snapshot is stale.';
      return;
    }

    const result = this.workspace.resolveProgressRollForTrack(track.id);
    if (!result.ok) {
      this.progressMessage = result.errors[0]?.message ?? 'Progress roll could not be resolved.';
      return;
    }

    this.latestProgressRoll = result.value;
    this.progressMessage = `Progress roll: score ${result.value.progressScore} vs ${result.value.challengeDice[0]} and ${result.value.challengeDice[1]} — ${this.outcomeLabel(result.value.outcome)}${result.value.isMatch ? ', match' : ', no match'}.`;
  }

  protected outcomeLabel(outcome: ProgressRollResult['outcome']): string {
    return outcome.replace('_', ' ');
  }

  protected prepareCorrection(track: ProgressTrack): void {
    this.correctionTicks = track.ticks;
    this.progressMessage = 'Enter a deliberate progress correction in ticks.';
  }

  protected applyCorrection(track: ProgressTrack, ticksValue: string | number): void {
    const ticks =
      typeof ticksValue === 'string' && ticksValue.trim() === '' ? Number.NaN : Number(ticksValue);
    const normal = correctProgressTicks(ticks);
    const isDestructive = Number.isFinite(ticks) && ticks < track.ticks;

    if (!normal.ok) {
      const confirmed = window.confirm(
        'This correction is outside normal progress bounds. Apply it as a manual override?',
      );
      if (!confirmed) {
        this.progressMessage = 'Manual correction canceled; progress was preserved.';
        return;
      }
      const manual = correctProgressTicks(ticks, { mode: 'manual_correction' });
      if (!manual.ok) {
        this.progressMessage = manual.errors[0]?.message ?? 'Progress correction is invalid.';
        return;
      }
      this.saveProgressTicks(
        track.id,
        manual.value.ticks,
        'Manual progress correction applied.',
        true,
      );
      return;
    }

    if (track.progressMode === 'manual_override') {
      const confirmed = window.confirm(
        'Return this track to standard progress mode? The current value must be within normal bounds.',
      );
      if (!confirmed) {
        this.progressMessage = 'Return to standard mode canceled; manual override remains active.';
        return;
      }
      this.saveProgressTicks(track.id, normal.value.ticks, 'Standard progress mode restored.');
      return;
    }

    if (isDestructive) {
      const confirmed = window.confirm('This correction lowers existing progress. Apply it?');
      if (!confirmed) {
        this.progressMessage = 'Progress correction canceled; progress was preserved.';
        return;
      }
    }

    this.saveProgressTicks(track.id, normal.value.ticks, 'Progress correction applied.');
  }

  protected saveTrack(): void {
    this.fieldErrors = {};
    this.formMessage = '';
    if (this.trackForm.invalid) {
      this.trackForm.markAllAsTouched();
      this.fieldErrors = { title: 'Enter a track name.' };
      return;
    }

    const value = this.trackForm.getRawValue();
    const current = this.editingTrackId ? this.workspace.selectedProgressTrack() : null;
    if (current && current.rank !== value.rank && current.ticks > 0) {
      const confirmed = window.confirm(
        'Changing rank keeps current progress ticks. No recalculation will be made.',
      );
      if (!confirmed) {
        this.formMessage = 'Rank change canceled; progress was preserved.';
        return;
      }
    }

    const result = this.workspace.saveProgressTrack({
      id: this.editingTrackId ?? undefined,
      title: value.title,
      type: value.type,
      rank: value.rank,
      notes: value.notes,
    });

    if (!result.ok) {
      this.applyErrors(result.errors);
      return;
    }

    this.editingTrackId = result.track.id;
    this.formMessage = 'Progress track saved.';
    this.trackForm.markAsPristine();
  }

  protected showError(controlName: 'title' | 'type' | 'rank'): boolean {
    const control = this.trackForm.controls[controlName];
    return (
      Boolean(this.fieldErrors[controlName]) ||
      (control.invalid && (control.touched || control.dirty))
    );
  }

  private saveProgressTicks(
    trackId: string,
    ticks: number,
    message: string,
    manualOverride = false,
  ): void {
    const result = this.workspace.updateProgressTrackTicks(
      trackId,
      ticks,
      manualOverride ? { mode: 'manual_correction' } : undefined,
    );
    this.progressMessage = result.ok
      ? `${message} ${result.track.ticks} ticks, score ${Math.min(10, Math.max(0, Math.floor(result.track.ticks / PROGRESS_TICKS_PER_BOX)))}.${result.track.progressMode === 'manual_override' ? ' Manual override is active.' : ''}`
      : (result.errors[0]?.message ?? 'Progress update failed.');
  }

  protected returnToStandard(track: ProgressTrack): void {
    const confirmed = window.confirm(
      'Return this track to standard progress mode? The current value must be within normal bounds.',
    );
    if (!confirmed) {
      this.progressMessage = 'Return to standard mode canceled; manual override remains active.';
      return;
    }
    this.saveProgressTicks(track.id, track.ticks, 'Standard progress mode restored.');
  }

  private loadTrack(track: ProgressTrack): void {
    this.editingTrackId = track.id;
    this.trackForm.reset({
      title: track.title,
      type: track.type,
      rank: track.rank,
      notes: track.notes ?? '',
    });
    this.fieldErrors = {};
    this.formMessage = 'Editing selected progress track.';
  }

  private applyErrors(errors: readonly ValidationError[]): void {
    this.fieldErrors = Object.fromEntries(
      errors
        .filter(
          (error): error is ValidationError & { field: 'title' | 'type' | 'rank' } =>
            error.field === 'title' || error.field === 'type' || error.field === 'rank',
        )
        .map((error) => [error.field, error.message]),
    );
    this.formMessage = 'Fix the highlighted fields.';
    this.focusFirstFieldError();
  }

  private focusFirstFieldError(): void {
    const firstField = (['title', 'type', 'rank'] as const).find(
      (field) => this.fieldErrors[field],
    );
    if (!firstField) return;
    document.getElementById(`track-${firstField}`)?.focus();
  }

  private toListItem(
    track: ProgressTrack,
    linkedVow?: { readonly id: string; readonly title: string; readonly status: string },
  ): ProgressTrackListItem {
    const title = this.cleanText(track.title) || 'Untitled progress track';
    const status = this.cleanText(track.status);
    const manualOverride = track.progressMode === 'manual_override';
    const progress = progressScoreFromState({ ticks: track.ticks }, { mode: 'manual_correction' });
    const ticks = progress.ok ? progress.value.ticks : 0;
    const boxes = progress.ok ? progress.value.boxes : 0;
    const score = progress.ok ? progress.value.progressScore : 0;
    const increment = progressRankIncrementTicks(track.rank);
    const incrementTicks = increment.ok ? increment.value : 0;
    const markDisabled =
      manualOverride || !increment.ok || ticks + incrementTicks > MAX_PROGRESS_TICKS;
    const unmarkDisabled =
      manualOverride || !increment.ok || ticks - incrementTicks < MIN_PROGRESS_TICKS;

    return {
      track,
      title,
      typeLabel: PROGRESS_TRACK_TYPE_LABELS[track.type] ?? 'Unknown type',
      statusLabel: statusLabels[track.status] ?? (status ? status : 'Unknown status'),
      rankLabel: CHALLENGE_RANK_LABELS[track.rank] ?? null,
      progressLabel: `${ticks} progress tick${ticks === 1 ? '' : 's'}`,
      progressScoreLabel: `Score ${score}`,
      isManualOverride: manualOverride,
      overrideStatusLabel: manualOverride
        ? 'Manual override active; value is kept as entered until standard mode is confirmed.'
        : 'Standard progress mode',
      progressBoxes: Array.from({ length: 10 }, (_value, index) => index < boxes),
      markDisabled,
      unmarkDisabled,
      markHelp: manualOverride
        ? 'Manual override active; normal marking is paused.'
        : markDisabled
          ? `Marking would exceed ${MAX_PROGRESS_TICKS} ticks.`
          : `Mark ${incrementTicks} tick${incrementTicks === 1 ? '' : 's'}.`,
      rollDisabled: !progress.ok || manualOverride,
      unmarkHelp: manualOverride
        ? 'Manual override active; normal removing is paused.'
        : unmarkDisabled
          ? `Removing would go below ${MIN_PROGRESS_TICKS} ticks.`
          : `Remove ${incrementTicks} tick${incrementTicks === 1 ? '' : 's'}.`,
      notes: this.cleanText(track.notes),
      linkedVowId: linkedVow?.id,
      linkedVowSummary: linkedVow
        ? `${this.cleanText(linkedVow.title) || 'Untitled vow'} · ${linkedVow.status}`
        : 'No linked vow.',
    };
  }

  private cleanText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
