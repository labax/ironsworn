import { computed, Injectable, signal } from '@angular/core';

import {
  createDefaultProgressTrack,
  validateProgressTrackClassification,
  type ChallengeRank,
  type ProgressTrack,
  type ProgressTrackType,
} from '@app/domain/progress';
import { correctProgressTicks, type ProgressValidationOptions } from '@app/rules/progress-rolls';
import type { ValidationError } from '@app/rules/validation';

const cloneProgressTrack = (track: ProgressTrack): ProgressTrack => ({
  ...track,
  events: [...(track.events ?? [])],
});

const createEntityId = (prefix: string): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export interface SaveProgressTrackInput {
  readonly id?: string;
  readonly title: string;
  readonly type: ProgressTrackType;
  readonly rank: ChallengeRank;
  readonly notes?: string;
}

const compareProgressTracks = (left: ProgressTrack, right: ProgressTrack): number => {
  const leftCreated = typeof left.createdAt === 'string' ? left.createdAt : '';
  const rightCreated = typeof right.createdAt === 'string' ? right.createdAt : '';
  const createdComparison = leftCreated.localeCompare(rightCreated);

  if (createdComparison !== 0) {
    return createdComparison;
  }

  return left.id.localeCompare(right.id);
};

@Injectable({ providedIn: 'root' })
export class CampaignWorkspaceService {
  readonly workspaceName = signal('Local campaign workspace');
  readonly mode = signal('Ready for MVP features');

  private readonly progressTracksState = signal<readonly ProgressTrack[]>([]);
  private readonly selectedProgressTrackIdState = signal<string | null>(null);

  readonly progressTracks = computed<readonly ProgressTrack[]>(() =>
    [...this.progressTracksState()]
      .sort(compareProgressTracks)
      .map((track) => cloneProgressTrack(track)),
  );
  readonly selectedProgressTrackId = this.selectedProgressTrackIdState.asReadonly();
  readonly selectedProgressTrack = computed<ProgressTrack | null>(() => {
    const selectedId = this.selectedProgressTrackIdState();
    const selected = this.progressTracksState().find((track) => track.id === selectedId);

    return selected ? cloneProgressTrack(selected) : null;
  });

  setProgressTracks(tracks: readonly ProgressTrack[]): void {
    this.progressTracksState.set(tracks.map((track) => cloneProgressTrack(track)));
    const selectedId = this.selectedProgressTrackIdState();

    if (selectedId && !tracks.some((track) => track.id === selectedId)) {
      this.selectedProgressTrackIdState.set(null);
    }
  }

  saveProgressTrack(
    input: SaveProgressTrackInput,
  ): { ok: true; track: ProgressTrack } | { ok: false; errors: readonly ValidationError[] } {
    const classification = validateProgressTrackClassification(input);
    const title = input.title.trim();
    const errors = classification.ok ? [] : [...classification.errors];

    if (!title) {
      errors.push({ code: 'required', field: 'title', message: 'Enter a track name.' });
    }

    if (errors.length > 0 || !classification.ok) return { ok: false, errors };

    const now = new Date().toISOString();
    const notes = input.notes?.trim() || undefined;
    const existing = input.id
      ? this.progressTracksState().find((track) => track.id === input.id)
      : undefined;

    const track = existing
      ? cloneProgressTrack({
          ...existing,
          title,
          type: classification.value.type,
          rank: classification.value.rank,
          notes,
          updatedAt: now,
        })
      : createDefaultProgressTrack({
          id: createEntityId('progress-track'),
          createdAt: now,
          title,
          type: classification.value.type,
          rank: classification.value.rank,
          notes,
        });

    this.progressTracksState.update((tracks) =>
      existing
        ? tracks.map((candidate) => (candidate.id === existing.id ? track : candidate))
        : [...tracks, track],
    );
    this.selectedProgressTrackIdState.set(track.id);

    return { ok: true, track: cloneProgressTrack(track) };
  }

  selectProgressTrack(trackId: string): ProgressTrack | null {
    const selected = this.progressTracksState().find((track) => track.id === trackId) ?? null;
    this.selectedProgressTrackIdState.set(selected?.id ?? null);

    return selected ? cloneProgressTrack(selected) : null;
  }

  updateProgressTrackTicks(
    trackId: string,
    ticks: number,
    options?: ProgressValidationOptions,
  ): { ok: true; track: ProgressTrack } | { ok: false; errors: readonly ValidationError[] } {
    const progress = correctProgressTicks(ticks, options);
    if (!progress.ok) return { ok: false, errors: progress.errors };

    const existing = this.progressTracksState().find((track) => track.id === trackId);
    if (!existing) {
      return {
        ok: false,
        errors: [{ code: 'not_found', field: 'trackId', message: 'Progress track was not found.' }],
      };
    }

    const track = cloneProgressTrack({
      ...existing,
      ticks: progress.value.ticks,
      updatedAt: new Date().toISOString(),
    });

    this.progressTracksState.update((tracks) =>
      tracks.map((candidate) => (candidate.id === trackId ? track : candidate)),
    );
    this.selectedProgressTrackIdState.set(track.id);

    return { ok: true, track: cloneProgressTrack(track) };
  }

  clearProgressTracks(): void {
    this.progressTracksState.set([]);
    this.selectedProgressTrackIdState.set(null);
  }
}
