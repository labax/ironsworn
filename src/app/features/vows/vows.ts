import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CHALLENGE_RANK_LABELS,
  CHALLENGE_RANKS,
  MAX_PROGRESS_TICKS,
  PROGRESS_TRACK_TYPE_LABELS,
  type ChallengeRank,
  type ProgressTrack,
} from '@app/domain/progress';
import {
  CampaignWorkspaceService,
  type VowProgressRollResult,
} from '@app/domain/services/campaign-workspace.service';
import {
  VOW_STATUS_LABELS,
  VOW_STATUSES,
  type Vow,
  type VowMilestone,
  type VowStatus,
} from '@app/domain/vows';
import { progressScoreFromState, PROGRESS_TICKS_PER_BOX } from '@app/rules/progress-rolls';
import type { ValidationError } from '@app/rules/validation';

interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface VowListItem {
  readonly vow: Vow;
  readonly title: string;
  readonly rankLabel: string;
  readonly statusLabel: string;
  readonly description: string;
  readonly notes: string;
  readonly updatedLabel: string;
  readonly updatedMachineValue?: string;
  readonly progressSummary: string;
  readonly linkedTrack?: ProgressTrack;
  readonly progressWarning?: string;
  readonly milestones: readonly VowMilestone[];
  readonly outcomeSummary: string;
  readonly outcomeResolvedLabel: string;
  readonly outcomeResolvedMachineValue?: string;
}

const RANK_ORDER: Record<ChallengeRank, number> = Object.fromEntries(
  CHALLENGE_RANKS.map((rank, index) => [rank, index]),
) as Record<ChallengeRank, number>;

const STATUS_ORDER: Record<VowStatus, number> = {
  active: 0,
  fulfilled: 1,
  forsaken: 2,
  archived: 3,
};

const CONFIRMED_STATUSES: readonly VowStatus[] = ['fulfilled', 'forsaken', 'archived'];

const deleteVowConfirmation = (warnings: readonly string[]): string =>
  warnings.length > 0
    ? `Delete this vow? This cannot be undone. ${warnings.join(' ')}`
    : 'Delete this vow? This cannot be undone.';

const statusChangeConfirmation = (status: VowStatus): string =>
  status === 'archived'
    ? 'Archive this vow? You can restore it later.'
    : `Mark this vow ${VOW_STATUS_LABELS[status].toLowerCase()}?`;

export type VowStatusFilter = VowStatus | 'all';
export type VowRankFilter = ChallengeRank | 'all';
export type VowSortKey = 'updated' | 'created' | 'rank' | 'title' | 'progress';

export interface VowDiscoveryState {
  readonly status: VowStatusFilter;
  readonly rank: VowRankFilter;
  readonly search: string;
  readonly sort: VowSortKey;
}

const DEFAULT_DISCOVERY_STATE: VowDiscoveryState = {
  status: 'active',
  rank: 'all',
  search: '',
  sort: 'updated',
};

const normalizedSearch = (value: string): string => value.trim().toLocaleLowerCase();
const progressScore = (item: VowListItem): number =>
  item.linkedTrack ? Math.floor(item.linkedTrack.ticks / PROGRESS_TICKS_PER_BOX) : -1;
const compareText = (left: string, right: string): number =>
  left.localeCompare(right, undefined, { sensitivity: 'base' });
const compareBySort = (sort: VowSortKey, left: VowListItem, right: VowListItem): number => {
  switch (sort) {
    case 'created':
      return (right.vow.createdAt ?? '').localeCompare(left.vow.createdAt ?? '');
    case 'rank':
      return RANK_ORDER[left.vow.rank] - RANK_ORDER[right.vow.rank];
    case 'title':
      return compareText(left.title, right.title);
    case 'progress':
      return progressScore(right) - progressScore(left);
    case 'updated':
      return (right.vow.updatedAt ?? right.vow.createdAt ?? '').localeCompare(
        left.vow.updatedAt ?? left.vow.createdAt ?? '',
      );
  }
};

export const deriveVisibleVows = (
  items: readonly VowListItem[],
  state: VowDiscoveryState,
): readonly VowListItem[] => {
  const search = normalizedSearch(state.search);
  return items
    .filter((item) => state.status === 'all' || item.vow.status === state.status)
    .filter((item) => state.rank === 'all' || item.vow.rank === state.rank)
    .filter((item) => {
      if (!search) return true;
      return `${item.vow.title} ${item.vow.description ?? ''}`.toLocaleLowerCase().includes(search);
    })
    .slice()
    .sort((left, right) => {
      const primary = compareBySort(state.sort, left, right);
      if (primary !== 0) return primary;
      const updated = (right.vow.updatedAt ?? right.vow.createdAt ?? '').localeCompare(
        left.vow.updatedAt ?? left.vow.createdAt ?? '',
      );
      if (updated !== 0) return updated;
      const title = compareText(left.title, right.title);
      return title !== 0 ? title : left.vow.id.localeCompare(right.vow.id);
    });
};

const compareVowListItems = (left: VowListItem, right: VowListItem): number => {
  const statusComparison = STATUS_ORDER[left.vow.status] - STATUS_ORDER[right.vow.status];
  if (statusComparison !== 0) return statusComparison;

  const leftDate = left.vow.updatedAt ?? left.vow.createdAt ?? '';
  const rightDate = right.vow.updatedAt ?? right.vow.createdAt ?? '';
  const dateComparison = rightDate.localeCompare(leftDate);

  return dateComparison !== 0 ? dateComparison : left.vow.id.localeCompare(right.vow.id);
};

const formatTimestamp = (value: string | undefined): string => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Recorded date unavailable';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const compareMilestones = (left: VowMilestone, right: VowMilestone): number => {
  const dateComparison = (left.createdAt ?? '').localeCompare(right.createdAt ?? '');
  return dateComparison !== 0 ? dateComparison : left.id.localeCompare(right.id);
};

const progressSummaryFor = (
  vow: Vow,
  track: ProgressTrack | undefined,
): Pick<VowListItem, 'progressSummary' | 'progressWarning' | 'linkedTrack'> => {
  if (!vow.progressTrackId) return { progressSummary: 'No linked progress track.' };
  if (!track) {
    return {
      progressSummary: 'Progress unavailable.',
      progressWarning: 'Linked progress track is missing. Reopen the vow to repair the link.',
    };
  }

  return {
    linkedTrack: track,
    progressSummary: `${track.title} · ${PROGRESS_TRACK_TYPE_LABELS[track.type] ?? 'Unknown type'} · ${CHALLENGE_RANK_LABELS[track.rank] ?? 'Unknown rank'} · ${track.ticks} of ${MAX_PROGRESS_TICKS} ticks (${CHALLENGE_RANK_LABELS[track.rank] ?? 'Unknown rank'}, ${track.status}) · Score ${Math.floor(track.ticks / PROGRESS_TICKS_PER_BOX)}`,
  };
};

@Component({
  selector: 'app-vows',
  imports: [ReactiveFormsModule],
  templateUrl: './vows.html',
  styleUrl: './vows.css',
})
export class Vows {
  private readonly workspace = inject(CampaignWorkspaceService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly rankOptions: readonly SelectOption<ChallengeRank>[] = CHALLENGE_RANKS.map(
    (rank) => ({ value: rank, label: CHALLENGE_RANK_LABELS[rank] }),
  );
  protected readonly statusOptions: readonly SelectOption<VowStatus>[] = VOW_STATUSES.map(
    (status) => ({
      value: status,
      label: VOW_STATUS_LABELS[status],
    }),
  );
  protected readonly selectedVowId = this.workspace.selectedVowId;
  protected readonly statusFilter = signal<VowStatusFilter>(DEFAULT_DISCOVERY_STATE.status);
  protected readonly rankFilter = signal<VowRankFilter>(DEFAULT_DISCOVERY_STATE.rank);
  protected readonly searchText = signal(DEFAULT_DISCOVERY_STATE.search);
  protected readonly sortKey = signal<VowSortKey>(DEFAULT_DISCOVERY_STATE.sort);
  protected readonly loadError = computed(() => {
    try {
      this.workspace.vows();
      this.workspace.progressTracks();
      return '';
    } catch {
      return 'Vows could not be loaded. Try again or create a new vow.';
    }
  });
  protected readonly availableTracks = computed(() =>
    this.workspace
      .progressTracks()
      .filter((track) => !this.workspace.vows().some((vow) => vow.progressTrackId === track.id)),
  );
  protected readonly vows = computed<readonly VowListItem[]>(() => {
    try {
      const progressById = new Map(
        this.workspace.progressTracks().map((track) => [track.id, track]),
      );

      return this.workspace
        .vows()
        .map((vow) => {
          const progress = progressSummaryFor(
            vow,
            vow.progressTrackId ? progressById.get(vow.progressTrackId) : undefined,
          );

          return {
            vow,
            title: vow.title.trim() || 'Untitled vow',
            rankLabel: CHALLENGE_RANK_LABELS[vow.rank] ?? 'Unknown rank',
            statusLabel: VOW_STATUS_LABELS[vow.status] ?? 'Unknown status',
            description: vow.description ?? '',
            notes: vow.notes ?? '',
            updatedLabel: formatTimestamp(vow.updatedAt ?? vow.createdAt),
            updatedMachineValue: vow.updatedAt ?? vow.createdAt,
            milestones: [...(vow.milestones ?? [])].sort(compareMilestones),
            outcomeSummary: vow.outcome?.summary ?? '',
            outcomeResolvedLabel: formatTimestamp(vow.outcome?.resolvedAt),
            outcomeResolvedMachineValue: vow.outcome?.resolvedAt,
            ...progress,
          };
        })
        .sort(compareVowListItems);
    } catch {
      return [];
    }
  });

  protected readonly visibleVows = computed(() =>
    deriveVisibleVows(this.vows(), {
      status: this.statusFilter(),
      rank: this.rankFilter(),
      search: this.searchText(),
      sort: this.sortKey(),
    }),
  );

  protected readonly hasDiscoveryControls = computed(
    () =>
      Boolean(this.searchText()) ||
      this.statusFilter() !== DEFAULT_DISCOVERY_STATE.status ||
      this.rankFilter() !== DEFAULT_DISCOVERY_STATE.rank ||
      this.sortKey() !== DEFAULT_DISCOVERY_STATE.sort,
  );

  protected readonly vowForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
    rank: ['troublesome' as ChallengeRank, [Validators.required]],
    status: ['active' as VowStatus, [Validators.required]],
    notes: [''],
  });

  protected editingVowId: string | null = null;
  protected formMessage = '';
  protected fieldErrors: Partial<Record<'title' | 'rank' | 'status', string>> = {};
  protected milestoneDrafts: Record<string, string> = {};
  protected editingMilestoneIds: Record<string, string | undefined> = {};
  protected milestoneErrors: Record<string, string | undefined> = {};
  protected outcomeDrafts: Record<string, string> = {};
  protected editingOutcomeIds: Record<string, boolean | undefined> = {};
  protected outcomeErrors: Record<string, string | undefined> = {};
  protected linkSelections: Record<string, string | undefined> = {};
  private vowActionFocusReturnId: string | null = null;
  protected latestVowProgressRoll: Readonly<VowProgressRollResult> | null = null;
  protected progressRollErrors: Record<string, string | undefined> = {};
  private milestoneFocusReturnId: string | null = null;
  private outcomeFocusReturnId: string | null = null;
  private cleanFormSnapshot = JSON.stringify(this.vowForm.getRawValue());

  protected openCreate(): void {
    if (!this.confirmDiscard()) return;
    this.editingVowId = null;
    this.vowForm.reset({
      title: '',
      description: '',
      rank: 'troublesome',
      status: 'active',
      notes: '',
    });
    this.fieldErrors = {};
    this.markClean();
    this.formMessage = 'Creating a new vow.';
    this.focusTitle();
  }

  protected openVow(vowId: string): void {
    if (!this.confirmDiscard()) return;
    const vow = this.workspace.selectVow(vowId);
    if (!vow) return;
    this.editingVowId = vow.id;
    this.vowForm.reset({
      title: vow.title,
      description: vow.description ?? '',
      rank: vow.rank,
      status: vow.status,
      notes: vow.notes ?? '',
    });
    this.fieldErrors = {};
    this.markClean();
    this.formMessage = 'Editing selected vow.';
    this.focusTitle();
  }

  protected updateStatusFilter(value: string): void {
    this.statusFilter.set(
      value === 'all' || VOW_STATUSES.includes(value as VowStatus)
        ? (value as VowStatusFilter)
        : DEFAULT_DISCOVERY_STATE.status,
    );
  }

  protected updateRankFilter(value: string): void {
    this.rankFilter.set(
      value === 'all' || CHALLENGE_RANKS.includes(value as ChallengeRank)
        ? (value as VowRankFilter)
        : DEFAULT_DISCOVERY_STATE.rank,
    );
  }

  protected updateSortKey(value: string): void {
    const supported: readonly VowSortKey[] = ['updated', 'created', 'rank', 'title', 'progress'];
    this.sortKey.set(
      supported.includes(value as VowSortKey)
        ? (value as VowSortKey)
        : DEFAULT_DISCOVERY_STATE.sort,
    );
  }

  protected updateSearchText(value: string): void {
    this.searchText.set(value);
  }

  protected resetDiscovery(): void {
    this.statusFilter.set(DEFAULT_DISCOVERY_STATE.status);
    this.rankFilter.set(DEFAULT_DISCOVERY_STATE.rank);
    this.searchText.set(DEFAULT_DISCOVERY_STATE.search);
    this.sortKey.set(DEFAULT_DISCOVERY_STATE.sort);
    this.formMessage = 'Vow view reset to active vows.';
  }

  protected archiveVow(vowId: string): void {
    this.vowActionFocusReturnId = `vow-edit-${vowId}`;
    const confirmed = window.confirm('Archive this vow? You can restore it later.');
    if (!confirmed) {
      this.formMessage = 'Archive canceled; vow was unchanged.';
      this.focusVowActionReturn();
      return;
    }
    const result = this.workspace.archiveVow(vowId);
    this.formMessage = result.ok
      ? 'Vow archived. You can show archived vows and restore it later.'
      : (result.errors[0]?.message ?? 'Vow could not be archived.');
    this.focusVowActionReturn();
  }

  protected restoreVow(vowId: string): void {
    this.vowActionFocusReturnId = `vow-restore-${vowId}`;
    const result = this.workspace.restoreVow(vowId);
    this.formMessage = result.ok
      ? 'Vow restored.'
      : (result.errors[0]?.message ?? 'Vow could not be restored.');
    this.focusVowActionReturn();
  }

  protected deleteVow(vowId: string): void {
    this.vowActionFocusReturnId = `vow-delete-${vowId}`;
    const preview = this.workspace.previewDeleteVow(vowId);
    if (!preview.ok) {
      this.formMessage = preview.errors[0]?.message ?? 'Vow could not be deleted.';
      this.focusVowActionReturn();
      return;
    }

    const confirmed = window.confirm(
      deleteVowConfirmation(preview.warnings.map((warning) => warning.message)),
    );
    if (!confirmed) {
      this.formMessage = 'Delete canceled; vow was unchanged.';
      this.focusVowActionReturn();
      return;
    }

    const result = this.workspace.deleteVow(vowId);
    this.formMessage = result.ok
      ? 'Vow deleted. Linked progress tracks were not deleted.'
      : (result.errors[0]?.message ?? 'Vow could not be deleted.');
    if (this.editingVowId === vowId) {
      this.editingVowId = null;
      this.vowForm.reset({
        title: '',
        description: '',
        rank: 'troublesome',
        status: 'active',
        notes: '',
      });
      this.markClean();
    }
    this.focusTitle();
  }

  protected updateLinkSelection(vowId: string, trackId: string): void {
    this.linkSelections = { ...this.linkSelections, [vowId]: trackId };
  }

  protected linkExistingTrack(vowId: string): void {
    const trackId = this.linkSelections[vowId];
    if (!trackId) {
      this.formMessage = 'Choose a track to link.';
      return;
    }
    const result = this.workspace.linkVowToProgressTrack({ vowId, progressTrackId: trackId });
    this.formMessage = result.ok
      ? 'Vow linked to progress track.'
      : (result.errors[0]?.message ?? 'Link failed.');
  }

  protected createLinkedTrack(vowId: string): void {
    const result = this.workspace.createProgressTrackForVow({ vowId });
    this.formMessage = result.ok
      ? 'Vow progress track created and linked.'
      : (result.errors[0]?.message ?? 'Track could not be created.');
  }

  protected unlinkTrack(vowId: string): void {
    const confirmed = window.confirm(
      'Unlink this progress track? The vow and track will both remain.',
    );
    if (!confirmed) {
      this.formMessage = 'Unlink canceled; link was preserved.';
      return;
    }
    const result = this.workspace.unlinkVowProgressTrack(vowId);
    this.formMessage = result.ok
      ? 'Progress track unlinked. No records were deleted.'
      : (result.errors[0]?.message ?? 'Unlink failed.');
  }

  protected openLinkedTrack(trackId: string): void {
    this.workspace.selectProgressTrack(trackId);
    void this.router.navigate(['/trackers']);
  }

  protected rollVowProgress(item: VowListItem): void {
    this.latestVowProgressRoll = null;
    this.progressRollErrors = { ...this.progressRollErrors, [item.vow.id]: undefined };
    if (!item.linkedTrack) {
      this.progressRollErrors = {
        ...this.progressRollErrors,
        [item.vow.id]: item.vow.progressTrackId
          ? 'Repair the linked progress track before rolling.'
          : 'Link a progress track before rolling.',
      };
      return;
    }

    const current = this.workspace
      .progressTracks()
      .find((track) => track.id === item.linkedTrack?.id);
    if (
      !current ||
      current.updatedAt !== item.linkedTrack.updatedAt ||
      !Object.is(current.ticks, item.linkedTrack.ticks)
    ) {
      this.progressRollErrors = {
        ...this.progressRollErrors,
        [item.vow.id]: 'Progress roll unavailable because this track snapshot is stale.',
      };
      return;
    }

    const progress = progressScoreFromState({ ticks: current.ticks });
    if (!progress.ok) {
      this.progressRollErrors = {
        ...this.progressRollErrors,
        [item.vow.id]: progress.errors[0]?.message ?? 'Progress roll could not be resolved.',
      };
      return;
    }

    const result = this.workspace.resolveProgressRollForVow({ vowId: item.vow.id });
    if (!result.ok) {
      this.progressRollErrors = {
        ...this.progressRollErrors,
        [item.vow.id]: result.errors[0]?.message ?? 'Progress roll could not be resolved.',
      };
      return;
    }

    this.latestVowProgressRoll = result.value;
    this.formMessage = `Progress roll: score ${result.value.progressScore} vs ${result.value.challengeDice[0]} and ${result.value.challengeDice[1]} — ${this.outcomeLabel(result.value.outcome)}${result.value.isMatch ? ', match' : ', no match'}. Choose the narrative outcome separately.`;
  }

  protected outcomeLabel(outcome: VowProgressRollResult['outcome']): string {
    return outcome.replace('_', ' ');
  }

  protected formatRollTime(value: string): string {
    return formatTimestamp(value);
  }

  protected milestoneNote(vowId: string): string {
    return this.milestoneDrafts[vowId] ?? '';
  }

  protected updateMilestoneDraft(vowId: string, value: string): void {
    this.milestoneDrafts = { ...this.milestoneDrafts, [vowId]: value };
    this.milestoneErrors = { ...this.milestoneErrors, [vowId]: undefined };
  }

  protected startMilestoneEdit(vowId: string, milestone: VowMilestone): void {
    this.editingMilestoneIds = { ...this.editingMilestoneIds, [vowId]: milestone.id };
    this.milestoneDrafts = { ...this.milestoneDrafts, [vowId]: milestone.note ?? '' };
    this.formMessage = 'Editing milestone note. Progress is unchanged.';
    this.focusMilestoneEditor(vowId);
  }

  protected cancelMilestoneEdit(vowId: string): void {
    this.editingMilestoneIds = { ...this.editingMilestoneIds, [vowId]: undefined };
    this.milestoneDrafts = { ...this.milestoneDrafts, [vowId]: '' };
    this.milestoneErrors = { ...this.milestoneErrors, [vowId]: undefined };
    this.formMessage = 'Milestone edit canceled; vow was unchanged.';
    this.focusMilestoneAdd(vowId);
  }

  protected saveMilestone(vowId: string): void {
    const note = this.milestoneNote(vowId);
    const editingId = this.editingMilestoneIds[vowId];
    const result = editingId
      ? this.workspace.updateVowMilestone({ vowId, milestoneId: editingId, note })
      : this.workspace.addVowMilestone({ vowId, note });
    if (!result.ok) {
      this.milestoneErrors = {
        ...this.milestoneErrors,
        [vowId]: result.errors[0]?.message ?? 'Milestone could not be saved.',
      };
      this.focusMilestoneEditor(vowId);
      return;
    }
    this.editingMilestoneIds = { ...this.editingMilestoneIds, [vowId]: undefined };
    this.milestoneDrafts = { ...this.milestoneDrafts, [vowId]: '' };
    this.milestoneErrors = { ...this.milestoneErrors, [vowId]: undefined };
    this.formMessage = editingId
      ? 'Milestone updated. Mechanical progress is unchanged.'
      : 'Milestone recorded. Marking progress remains a separate action.';
    this.focusMilestoneAdd(vowId);
  }

  protected removeMilestone(vowId: string, milestoneId: string): void {
    this.milestoneFocusReturnId = `milestone-edit-${vowId}-${milestoneId}`;
    const confirmed = window.confirm('Delete this milestone note? This cannot be undone.');
    if (!confirmed) {
      this.formMessage = 'Milestone deletion canceled; vow was unchanged.';
      this.focusMilestoneReturn();
      return;
    }
    const result = this.workspace.removeVowMilestone({ vowId, milestoneId });
    if (!result.ok) {
      this.formMessage = result.errors[0]?.message ?? 'Milestone could not be deleted.';
      this.focusMilestoneReturn();
      return;
    }
    this.formMessage = 'Milestone deleted. Mechanical progress is unchanged.';
    this.focusMilestoneAdd(vowId);
  }

  protected startOutcomeEdit(vowId: string, summary: string): void {
    this.outcomeFocusReturnId = `outcome-edit-${vowId}`;
    this.editingOutcomeIds = { ...this.editingOutcomeIds, [vowId]: true };
    this.outcomeDrafts = { ...this.outcomeDrafts, [vowId]: summary };
    this.outcomeErrors = { ...this.outcomeErrors, [vowId]: undefined };
    this.formMessage = 'Editing outcome notes. Status and progress are unchanged.';
    this.focusOutcomeEditor(vowId);
  }

  protected outcomeNote(vowId: string): string {
    return this.outcomeDrafts[vowId] ?? '';
  }

  protected updateOutcomeDraft(vowId: string, value: string): void {
    this.outcomeDrafts = { ...this.outcomeDrafts, [vowId]: value };
    this.outcomeErrors = { ...this.outcomeErrors, [vowId]: undefined };
  }

  protected cancelOutcomeEdit(vowId: string): void {
    this.editingOutcomeIds = { ...this.editingOutcomeIds, [vowId]: undefined };
    this.outcomeDrafts = { ...this.outcomeDrafts, [vowId]: '' };
    this.outcomeErrors = { ...this.outcomeErrors, [vowId]: undefined };
    this.formMessage = 'Outcome note edit canceled; vow was unchanged.';
    this.focusOutcomeReturn();
  }

  protected saveOutcome(vowId: string): void {
    const result = this.workspace.updateVowOutcome({ vowId, summary: this.outcomeNote(vowId) });
    if (!result.ok) {
      this.outcomeErrors = {
        ...this.outcomeErrors,
        [vowId]: result.errors[0]?.message ?? 'Outcome notes could not be saved.',
      };
      this.focusOutcomeEditor(vowId);
      return;
    }

    this.editingOutcomeIds = { ...this.editingOutcomeIds, [vowId]: undefined };
    this.outcomeDrafts = { ...this.outcomeDrafts, [vowId]: '' };
    this.outcomeErrors = { ...this.outcomeErrors, [vowId]: undefined };
    this.formMessage = 'Outcome notes saved. Status and progress are unchanged.';
    this.focusOutcomeReturn();
  }

  protected saveVow(): void {
    this.fieldErrors = {};
    this.formMessage = '';
    if (this.vowForm.invalid) {
      this.vowForm.markAllAsTouched();
    }

    const value = this.vowForm.getRawValue();
    const statusPrompt = this.shouldOfferOutcomePrompt(value.status);
    if (!this.confirmStatusChange(value.status)) return;

    const result = this.workspace.saveVow({ id: this.editingVowId ?? undefined, ...value });
    if (!result.ok) {
      this.applyErrors(result.errors);
      return;
    }

    this.editingVowId = result.vow.id;
    this.markClean();
    this.formMessage = 'Vow saved.';
    if (statusPrompt && window.confirm('Add outcome notes now?')) {
      this.startOutcomeEdit(result.vow.id, result.vow.outcome?.summary ?? '');
      return;
    }
    this.focusTitle();
  }

  protected cancelEdit(): void {
    if (!this.confirmDiscard()) return;
    this.editingVowId = null;
    this.vowForm.reset({
      title: '',
      description: '',
      rank: 'troublesome',
      status: 'active',
      notes: '',
    });
    this.fieldErrors = {};
    this.markClean();
    this.formMessage = 'Changes discarded.';
    this.focusTitle();
  }

  protected showError(controlName: 'title' | 'rank' | 'status'): boolean {
    const control = this.vowForm.controls[controlName];
    return (
      Boolean(this.fieldErrors[controlName]) ||
      (control.invalid && (control.touched || control.dirty))
    );
  }

  private confirmDiscard(): boolean {
    if (
      !this.vowForm.dirty &&
      this.cleanFormSnapshot === JSON.stringify(this.vowForm.getRawValue())
    )
      return true;
    const confirmed = window.confirm('Discard unsaved vow changes?');
    if (!confirmed) {
      this.formMessage = 'Unsaved changes were kept.';
      return false;
    }
    return true;
  }

  private shouldOfferOutcomePrompt(nextStatus: VowStatus): boolean {
    if (!this.editingVowId || (nextStatus !== 'fulfilled' && nextStatus !== 'forsaken')) {
      return false;
    }

    const current = this.workspace.vows().find((vow) => vow.id === this.editingVowId);
    return Boolean(current && current.status !== nextStatus && !current.outcome?.summary);
  }

  private confirmStatusChange(nextStatus: VowStatus): boolean {
    if (!this.editingVowId || !CONFIRMED_STATUSES.includes(nextStatus)) return true;

    const currentStatus = this.workspace.vows().find((vow) => vow.id === this.editingVowId)?.status;
    if (currentStatus === nextStatus) return true;

    const confirmed = window.confirm(statusChangeConfirmation(nextStatus));
    if (!confirmed) {
      this.formMessage = 'Status change canceled; no changes saved.';
      return false;
    }

    return true;
  }

  private markClean(): void {
    this.vowForm.markAsPristine();
    this.cleanFormSnapshot = JSON.stringify(this.vowForm.getRawValue());
  }

  private applyErrors(errors: readonly ValidationError[]): void {
    this.fieldErrors = Object.fromEntries(
      errors
        .filter(
          (error): error is ValidationError & { field: 'title' | 'rank' | 'status' } =>
            error.field === 'title' || error.field === 'rank' || error.field === 'status',
        )
        .map((error) => [error.field, error.message]),
    );
    this.formMessage = 'Fix the highlighted fields.';
    this.focusFirstFieldError();
  }

  private focusFirstFieldError(): void {
    const firstField = (['title', 'rank', 'status'] as const).find(
      (field) => this.fieldErrors[field],
    );
    if (!firstField) return;
    document.getElementById(`vow-${firstField}`)?.focus();
  }

  protected formatMilestoneTimestamp(value: string): string {
    return formatTimestamp(value);
  }

  private focusOutcomeEditor(vowId: string): void {
    queueMicrotask(() => document.getElementById(`outcome-note-${vowId}`)?.focus());
  }

  private focusOutcomeReturn(): void {
    const targetId = this.outcomeFocusReturnId;
    if (!targetId) return;
    setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        return;
      }
      this.focusTitle();
    });
  }

  private focusMilestoneEditor(vowId: string): void {
    queueMicrotask(() => document.getElementById(`milestone-note-${vowId}`)?.focus());
  }

  private focusMilestoneAdd(vowId: string): void {
    queueMicrotask(() => document.getElementById(`milestone-note-${vowId}`)?.focus());
  }

  private focusMilestoneReturn(): void {
    const targetId = this.milestoneFocusReturnId;
    if (!targetId) return;
    queueMicrotask(() => document.getElementById(targetId)?.focus());
  }

  private focusVowActionReturn(): void {
    const targetId = this.vowActionFocusReturnId;
    if (!targetId) return;
    queueMicrotask(() => document.getElementById(targetId)?.focus());
  }

  private focusTitle(): void {
    queueMicrotask(() => this.titleInput()?.nativeElement.focus());
  }
}
