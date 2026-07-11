import { computed, Injectable, signal } from '@angular/core';

import type { ProgressTrack } from '@app/domain/progress';

const cloneProgressTrack = (track: ProgressTrack): ProgressTrack => ({
  ...track,
  events: [...(track.events ?? [])],
});

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

  selectProgressTrack(trackId: string): ProgressTrack | null {
    const selected = this.progressTracksState().find((track) => track.id === trackId) ?? null;
    this.selectedProgressTrackIdState.set(selected?.id ?? null);

    return selected ? cloneProgressTrack(selected) : null;
  }

  clearProgressTracks(): void {
    this.progressTracksState.set([]);
    this.selectedProgressTrackIdState.set(null);
  }
}
