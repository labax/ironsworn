import { Component, computed, inject } from '@angular/core';

import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import type { ProgressTrack, ProgressTrackStatus, ProgressTrackType } from '@app/domain/progress';

interface ProgressTrackListItem {
  readonly track: ProgressTrack;
  readonly title: string;
  readonly typeLabel: string;
  readonly statusLabel: string;
  readonly rankLabel: string | null;
  readonly progressLabel: string;
  readonly notes: string | null;
}

const titleCase = (value: string): string =>
  value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const typeLabels: Record<ProgressTrackType, string> = {
  vow: 'Vow',
  journey: 'Journey',
  combat: 'Combat',
  bond: 'Bond',
  custom: 'Custom',
};

const statusLabels: Record<ProgressTrackStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  failed: 'Failed',
  forsaken: 'Forsaken',
  archived: 'Archived',
};

@Component({
  selector: 'app-trackers',
  templateUrl: './trackers.html',
  styleUrl: './trackers.css',
})
export class Trackers {
  private readonly workspace = inject(CampaignWorkspaceService);

  protected readonly selectedProgressTrackId = this.workspace.selectedProgressTrackId;
  protected readonly tracks = computed<readonly ProgressTrackListItem[]>(() =>
    this.workspace.progressTracks().map((track) => this.toListItem(track)),
  );

  protected openTrack(trackId: string): void {
    this.workspace.selectProgressTrack(trackId);
  }

  protected trackById(_index: number, item: ProgressTrackListItem): string {
    return item.track.id;
  }

  private toListItem(track: ProgressTrack): ProgressTrackListItem {
    const title = this.cleanText(track.title) || 'Untitled progress track';
    const type = this.cleanText(track.type);
    const status = this.cleanText(track.status);
    const rank = this.cleanText(track.rank);
    const ticks = Number.isFinite(track.ticks) ? Math.max(0, Math.trunc(track.ticks)) : 0;

    return {
      track,
      title,
      typeLabel: typeLabels[track.type] ?? (type ? titleCase(type) : 'Unknown type'),
      statusLabel: statusLabels[track.status] ?? (status ? titleCase(status) : 'Unknown status'),
      rankLabel: rank ? titleCase(rank) : null,
      progressLabel: `${ticks} progress tick${ticks === 1 ? '' : 's'}`,
      notes: this.cleanText(track.notes),
    };
  }

  private cleanText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
