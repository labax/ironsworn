import { Component, computed, effect, inject } from '@angular/core';
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
import type { ValidationError } from '@app/rules/validation';

interface ProgressTrackListItem {
  readonly track: ProgressTrack;
  readonly title: string;
  readonly typeLabel: string;
  readonly statusLabel: string;
  readonly rankLabel: string | null;
  readonly progressLabel: string;
  readonly notes: string | null;
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

  protected readonly typeOptions: readonly SelectOption<ProgressTrackType>[] =
    PROGRESS_TRACK_TYPES.map((type) => ({ value: type, label: PROGRESS_TRACK_TYPE_LABELS[type] }));
  protected readonly rankOptions: readonly SelectOption<ChallengeRank>[] = CHALLENGE_RANKS.map(
    (rank) => ({ value: rank, label: CHALLENGE_RANK_LABELS[rank] }),
  );

  protected readonly selectedProgressTrackId = this.workspace.selectedProgressTrackId;
  protected readonly selectedTrack = this.workspace.selectedProgressTrack;
  protected readonly tracks = computed<readonly ProgressTrackListItem[]>(() =>
    this.workspace.progressTracks().map((track) => this.toListItem(track)),
  );

  protected readonly trackForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    type: ['vow' as ProgressTrackType, [Validators.required]],
    rank: ['troublesome' as ChallengeRank, [Validators.required]],
    notes: [''],
  });

  protected editingTrackId: string | null = null;
  protected formMessage = '';
  protected fieldErrors: Partial<Record<'title' | 'type' | 'rank', string>> = {};

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
  }

  private toListItem(track: ProgressTrack): ProgressTrackListItem {
    const title = this.cleanText(track.title) || 'Untitled progress track';
    const status = this.cleanText(track.status);
    const ticks = Number.isFinite(track.ticks) ? Math.max(0, Math.trunc(track.ticks)) : 0;

    return {
      track,
      title,
      typeLabel: PROGRESS_TRACK_TYPE_LABELS[track.type] ?? 'Unknown type',
      statusLabel: statusLabels[track.status] ?? (status ? status : 'Unknown status'),
      rankLabel: CHALLENGE_RANK_LABELS[track.rank] ?? null,
      progressLabel: `${ticks} progress tick${ticks === 1 ? '' : 's'}`,
      notes: this.cleanText(track.notes),
    };
  }

  private cleanText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
