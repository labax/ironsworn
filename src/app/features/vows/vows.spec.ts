import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';

import { createDefaultProgressTrack, type ProgressTrack } from '@app/domain/progress';
import { createDefaultVow, type Vow } from '@app/domain/vows';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';

import { deriveVisibleVows, type VowListItem, Vows } from './vows';

const progressFixture = (overrides: Partial<ProgressTrack> = {}): ProgressTrack => ({
  ...createDefaultProgressTrack({
    id: 'progress-track-default',
    createdAt: '2026-07-01T00:00:00.000Z',
    title: 'Track the promise',
    type: 'vow',
    rank: 'formidable',
  }),
  ticks: 12,
  ...overrides,
});

const vowFixture = (overrides: Partial<Vow> = {}): Vow => ({
  ...createDefaultVow({
    id: 'vow-default',
    createdAt: '2026-07-01T00:00:00.000Z',
    title: 'Carry word to Hillwatch',
    rank: 'dangerous',
    description: 'A user-authored promise.',
    notes: 'Ask Mara about the east road.',
  }),
  ...overrides,
});

const listItemFixture = (vow: Vow, linkedTrack?: ProgressTrack): VowListItem => ({
  vow,
  title: vow.title,
  rankLabel: vow.rank,
  statusLabel: vow.status,
  description: vow.description ?? '',
  notes: vow.notes ?? '',
  updatedLabel: vow.updatedAt ?? vow.createdAt,
  updatedMachineValue: vow.updatedAt ?? vow.createdAt,
  progressSummary: linkedTrack ? `${linkedTrack.ticks}` : 'No linked progress track.',
  linkedTrack,
  milestones: vow.milestones,
  outcomeSummary: vow.outcome?.summary ?? '',
  outcomeResolvedLabel: vow.outcome?.resolvedAt ?? 'Not recorded',
  outcomeResolvedMachineValue: vow.outcome?.resolvedAt,
});

describe('Vows', () => {
  let fixture: ComponentFixture<Vows>;
  let workspace: CampaignWorkspaceService;
  const compiled = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const createComponent = () => {
    fixture = TestBed.createComponent(Vows);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    await TestBed.configureTestingModule({
      imports: [Vows],
      providers: [provideRouter([])],
    }).compileComponents();
    workspace = TestBed.inject(CampaignWorkspaceService);
    workspace.clearVows();
    workspace.clearProgressTracks();
  });

  it('renders an empty state with a create action', () => {
    createComponent();

    expect(compiled().textContent).toContain('No vows yet.');
    expect(
      compiled().querySelector<HTMLButtonElement>('.empty-state button')?.textContent,
    ).toContain('Create vow');
  });

  it('sorts visible vows by timestamp with stable-id tie ordering', () => {
    workspace.setVows([
      vowFixture({
        id: 'vow-fulfilled',
        title: 'Past promise',
        status: 'fulfilled',
        updatedAt: '2026-07-10T00:00:00.000Z',
      }),
      vowFixture({
        id: 'vow-active-b',
        title: 'Second active',
        status: 'active',
        updatedAt: '2026-07-08T00:00:00.000Z',
      }),
      vowFixture({
        id: 'vow-active-a',
        title: 'First active',
        status: 'active',
        updatedAt: '2026-07-08T00:00:00.000Z',
      }),
    ]);
    createComponent();

    fixture.componentInstance['updateStatusFilter']('all');
    fixture.detectChanges();

    const titles = Array.from(compiled().querySelectorAll('.vow-title-block h3')).map((node) =>
      node.textContent?.trim(),
    );
    expect(titles).toEqual(['Past promise', 'First active', 'Second active']);
    expect(compiled().textContent).toContain('Default view shows active vows only.');
  });

  it('derives search filter sort reset and no-results views without mutating source records', () => {
    const items = [
      listItemFixture(
        vowFixture({
          id: 'vow-active-dangerous',
          title: 'Mend the watchtower',
          rank: 'dangerous',
          status: 'active',
          description: 'Raise a signal fire.',
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-04T00:00:00.000Z',
          progressTrackId: 'track-low',
        }),
        progressFixture({ id: 'track-low', ticks: 8 }),
      ),
      listItemFixture(
        vowFixture({
          id: 'vow-active-epic',
          title: 'Cross the silent ice',
          rank: 'epic',
          status: 'active',
          description: 'Find the hidden bell.',
          createdAt: '2026-07-02T00:00:00.000Z',
          updatedAt: '2026-07-03T00:00:00.000Z',
          progressTrackId: 'track-high',
        }),
        progressFixture({ id: 'track-high', ticks: 28 }),
      ),
      listItemFixture(
        vowFixture({
          id: 'vow-fulfilled',
          title: 'Settle the river debt',
          rank: 'formidable',
          status: 'fulfilled',
          description: 'A completed user promise.',
          createdAt: '2026-07-05T00:00:00.000Z',
          updatedAt: '2026-07-05T00:00:00.000Z',
        }),
      ),
      listItemFixture(
        vowFixture({
          id: 'vow-forsaken',
          title: 'Chart the western fog',
          rank: 'troublesome',
          status: 'forsaken',
          description: 'Abandoned by choice.',
          createdAt: '2026-07-06T00:00:00.000Z',
          updatedAt: '2026-07-06T00:00:00.000Z',
        }),
      ),
      listItemFixture(
        vowFixture({
          id: 'vow-archived',
          title: 'Archive the ember map',
          rank: 'extreme',
          status: 'archived',
          description: 'Stored for later discovery.',
          createdAt: '2026-07-07T00:00:00.000Z',
          updatedAt: '2026-07-07T00:00:00.000Z',
        }),
      ),
    ];
    const snapshot = JSON.stringify(items);
    const ids = (result: readonly VowListItem[]) => result.map((item) => item.vow.id);

    expect(
      ids(deriveVisibleVows(items, { status: 'active', rank: 'all', search: '', sort: 'updated' })),
    ).toEqual(['vow-active-dangerous', 'vow-active-epic']);
    expect(
      ids(
        deriveVisibleVows(items, { status: 'fulfilled', rank: 'all', search: '', sort: 'updated' }),
      ),
    ).toEqual(['vow-fulfilled']);
    expect(
      ids(
        deriveVisibleVows(items, { status: 'forsaken', rank: 'all', search: '', sort: 'updated' }),
      ),
    ).toEqual(['vow-forsaken']);
    expect(
      ids(
        deriveVisibleVows(items, { status: 'archived', rank: 'all', search: '', sort: 'updated' }),
      ),
    ).toEqual(['vow-archived']);
    expect(
      ids(deriveVisibleVows(items, { status: 'all', rank: 'epic', search: '', sort: 'updated' })),
    ).toEqual(['vow-active-epic']);
    expect(
      ids(
        deriveVisibleVows(items, {
          status: 'all',
          rank: 'all',
          search: 'hidden bell',
          sort: 'updated',
        }),
      ),
    ).toEqual(['vow-active-epic']);
    expect(
      ids(
        deriveVisibleVows(items, { status: 'all', rank: 'all', search: '', sort: 'created' }),
      ).slice(0, 2),
    ).toEqual(['vow-archived', 'vow-forsaken']);
    expect(
      ids(deriveVisibleVows(items, { status: 'active', rank: 'all', search: '', sort: 'rank' })),
    ).toEqual(['vow-active-dangerous', 'vow-active-epic']);
    expect(
      ids(deriveVisibleVows(items, { status: 'active', rank: 'all', search: '', sort: 'title' })),
    ).toEqual(['vow-active-epic', 'vow-active-dangerous']);
    expect(
      ids(
        deriveVisibleVows(items, { status: 'active', rank: 'all', search: '', sort: 'progress' }),
      ),
    ).toEqual(['vow-active-epic', 'vow-active-dangerous']);
    expect(
      deriveVisibleVows(items, {
        status: 'active',
        rank: 'epic',
        search: 'signal',
        sort: 'updated',
      }),
    ).toEqual([]);
    expect(JSON.stringify(items)).toBe(snapshot);
  });

  it('renders accessible discovery controls, preserves them while editing, resets, and recovers from no results', () => {
    workspace.setVows([
      vowFixture({
        id: 'vow-active-ui',
        title: 'Signal the ford',
        description: 'Light a lamp.',
        status: 'active',
      }),
      vowFixture({
        id: 'vow-archived-ui',
        title: 'Buried oath',
        description: 'Hidden cache.',
        status: 'archived',
      }),
    ]);
    createComponent();

    expect(compiled().textContent).toContain('Default view shows active vows only.');
    expect(compiled().textContent).toContain('Signal the ford');
    expect(compiled().textContent).not.toContain('Buried oath');
    expect(compiled().querySelector('#vow-search')?.getAttribute('aria-describedby')).toBe(
      'vow-search-help',
    );

    fixture.componentInstance['updateStatusFilter']('archived');
    fixture.detectChanges();
    expect(compiled().textContent).toContain('Buried oath');

    fixture.componentInstance['openVow']('vow-archived-ui');
    fixture.detectChanges();
    expect(fixture.componentInstance['statusFilter']()).toBe('archived');

    fixture.componentInstance['updateSearchText']('not present');
    fixture.detectChanges();
    expect(compiled().textContent).toContain('No vows match this view.');

    fixture.componentInstance['resetDiscovery']();
    fixture.detectChanges();
    expect(fixture.componentInstance['statusFilter']()).toBe('active');
    expect(fixture.componentInstance['searchText']()).toBe('');
    expect(compiled().textContent).toContain('Signal the ford');
  });

  it('opens the selected vow by stable id', () => {
    workspace.setVows([
      vowFixture({ id: 'vow-one', title: 'First visible duplicate' }),
      vowFixture({ id: 'vow-two', title: 'First visible duplicate', notes: 'The selected note.' }),
    ]);
    createComponent();

    fixture.componentInstance['openVow']('vow-two');

    expect(workspace.selectedVowId()).toBe('vow-two');
    expect(fixture.componentInstance['vowForm'].getRawValue().notes).toBe('The selected note.');
  });

  it('derives linked progress from the progress track and warns when the link is broken', () => {
    workspace.setProgressTracks([
      progressFixture({ id: 'track-linked', ticks: 16, rank: 'extreme', status: 'active' }),
    ]);
    workspace.setVows([
      vowFixture({ id: 'vow-linked', title: 'Linked vow', progressTrackId: 'track-linked' }),
      vowFixture({ id: 'vow-broken', title: 'Broken vow', progressTrackId: 'missing-track' }),
    ]);
    createComponent();

    expect(compiled().textContent).toContain('16 of 40 ticks (Extreme, active)');
    expect(compiled().textContent).toContain('Linked progress track is missing.');
  });

  it('shows a safe failed-load state', () => {
    vi.spyOn(workspace, 'vows').mockImplementation(() => {
      throw new Error('load failed');
    });
    createComponent();

    expect(compiled().textContent).toContain('Vows are unavailable.');
    expect(compiled().textContent).toContain('Vows could not be loaded.');
    expect(
      compiled().querySelector<HTMLButtonElement>('.error-state button')?.textContent,
    ).toContain('Create vow');
  });

  it('creates a typed vow with stable identity, timestamps, and user-authored text', () => {
    createComponent();
    const longNotes = 'Keep this long user note safe. '.repeat(80);
    fixture.componentInstance['vowForm'].setValue({
      title: 'Guard the winter stores',
      description: 'Named by the player.\nSecond line.',
      rank: 'formidable',
      status: 'active',
      notes: longNotes,
    });
    fixture.componentInstance['saveVow']();
    fixture.detectChanges();

    const saved = workspace.vows()[0];
    expect(saved).toMatchObject({
      title: 'Guard the winter stores',
      description: 'Named by the player.\nSecond line.',
      rank: 'formidable',
      status: 'active',
      notes: longNotes,
      type: 'normal',
      milestones: [],
    });
    expect(saved?.id).toMatch(/^vow-/);
    expect(saved?.createdAt).toBe(saved?.updatedAt);
    expect(compiled().textContent).toContain(longNotes);
  });

  it('edits only intended vow fields and preserves unrelated links, outcome, milestones, and metadata', () => {
    const original = vowFixture({
      id: 'vow-edit',
      progressTrackId: 'progress-track-1',
      characterId: 'character-1',
      campaignId: 'campaign-1',
      milestones: [
        { id: 'milestone-1', createdAt: '2026-07-02T00:00:00.000Z', note: 'First step' },
      ],
      outcome: { summary: 'Resolved by user', resolvedAt: '2026-07-03T00:00:00.000Z' },
    });
    const unrelated = vowFixture({ id: 'vow-other', title: 'Unrelated vow' });
    workspace.setVows([original, unrelated]);
    createComponent();

    fixture.componentInstance['openVow']('vow-edit');
    fixture.componentInstance['vowForm'].setValue({
      title: 'Carry word to Stoneford',
      description: 'Updated context.',
      rank: 'epic',
      status: 'fulfilled',
      notes: 'Updated note.',
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance['saveVow']();

    expect(confirmSpy).toHaveBeenCalledWith('Mark this vow fulfilled?');
    const saved = workspace.vows().find((vow) => vow.id === 'vow-edit');
    expect(saved).toMatchObject({
      id: 'vow-edit',
      title: 'Carry word to Stoneford',
      description: 'Updated context.',
      rank: 'epic',
      status: 'fulfilled',
      notes: 'Updated note.',
      progressTrackId: 'progress-track-1',
      characterId: 'character-1',
      campaignId: 'campaign-1',
      outcome: original.outcome,
    });
    expect(saved?.createdAt).toBe(original.createdAt);
    expect(saved?.milestones).toEqual(original.milestones);
    expect(workspace.vows().find((vow) => vow.id === 'vow-other')).toEqual(unrelated);
  });

  it('requires confirmation for terminal or disruptive status changes and cancel leaves state unchanged', () => {
    const original = vowFixture({
      id: 'vow-status',
      status: 'active',
      progressTrackId: 'track-status',
    });
    const track = progressFixture({ id: 'track-status', ticks: 20 });
    workspace.setVows([original]);
    workspace.setProgressTracks([track]);
    createComponent();
    fixture.componentInstance['openVow']('vow-status');
    fixture.componentInstance['vowForm'].patchValue({ status: 'forsaken', rank: 'epic' });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    fixture.componentInstance['saveVow']();

    expect(confirmSpy).toHaveBeenCalledWith('Mark this vow forsaken?');
    expect(workspace.vows()[0]).toEqual(original);
    expect(workspace.progressTracks()[0]).toEqual(track);
    expect(fixture.componentInstance['vowForm'].getRawValue().status).toBe('forsaken');

    confirmSpy.mockReturnValue(true);
    fixture.componentInstance['saveVow']();
    expect(workspace.vows()[0]).toMatchObject({
      id: 'vow-status',
      status: 'forsaken',
      rank: 'epic',
    });
    expect(workspace.progressTracks()[0].ticks).toBe(20);
  });

  it('allows deliberate correction of an accidental terminal status without changing progress', () => {
    workspace.setVows([
      vowFixture({ id: 'vow-correct', status: 'fulfilled', progressTrackId: 'track-correct' }),
    ]);
    workspace.setProgressTracks([progressFixture({ id: 'track-correct', ticks: 8 })]);
    createComponent();
    fixture.componentInstance['openVow']('vow-correct');
    fixture.componentInstance['vowForm'].patchValue({ status: 'active' });

    fixture.componentInstance['saveVow']();

    expect(workspace.vows()[0].status).toBe('active');
    expect(workspace.progressTracks()[0].ticks).toBe(8);
  });

  it('records edits orders and confirms deletion of milestones with accessible focus behavior', () => {
    const original = vowFixture({
      id: 'vow-milestones',
      progressTrackId: 'track-milestones',
      milestones: [
        { id: 'milestone-late', createdAt: '2026-07-03T00:00:00.000Z', note: 'Late note' },
        { id: 'milestone-early', createdAt: '2026-07-02T00:00:00.000Z', note: 'Early note' },
      ],
    });
    const track = progressFixture({ id: 'track-milestones', ticks: 16 });
    workspace.setVows([original]);
    workspace.setProgressTracks([track]);
    createComponent();

    expect(compiled().textContent).toContain('recording a milestone never marks progress');
    const notes = Array.from(compiled().querySelectorAll('.milestone-record .vow-text')).map(
      (node) => node.textContent?.trim(),
    );
    expect(notes).toEqual(['Early note', 'Late note']);
    const textarea = compiled().querySelector<HTMLTextAreaElement>(
      '#milestone-note-vow-milestones',
    );
    expect(textarea?.getAttribute('aria-describedby')).toContain('milestone-help-vow-milestones');

    fixture.componentInstance['updateMilestoneDraft'](
      'vow-milestones',
      'New milestone '.repeat(80),
    );
    fixture.componentInstance['saveMilestone']('vow-milestones');
    fixture.detectChanges();

    expect(workspace.progressTracks()[0]).toEqual(track);
    expect(workspace.vows()[0]).toMatchObject({
      id: original.id,
      rank: original.rank,
      status: original.status,
      progressTrackId: original.progressTrackId,
      notes: original.notes,
      outcome: original.outcome,
    });
    expect(workspace.vows()[0].milestones).toHaveLength(3);
    const created = workspace
      .vows()[0]
      .milestones.find((milestone) => milestone.note?.startsWith('New milestone'));
    expect(created?.id).toMatch(/^vow-milestone-/);

    fixture.componentInstance['startMilestoneEdit'](
      'vow-milestones',
      workspace.vows()[0].milestones.find((milestone) => milestone.id === 'milestone-early')!,
    );
    fixture.componentInstance['updateMilestoneDraft']('vow-milestones', 'Edited early note');
    fixture.componentInstance['saveMilestone']('vow-milestones');
    expect(
      workspace.vows()[0].milestones.find((milestone) => milestone.id === 'milestone-early'),
    ).toMatchObject({
      id: 'milestone-early',
      createdAt: '2026-07-02T00:00:00.000Z',
      note: 'Edited early note',
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance['removeMilestone']('vow-milestones', 'milestone-early');
    expect(confirmSpy).toHaveBeenCalledWith('Delete this milestone note? This cannot be undone.');
    expect(
      workspace.vows()[0].milestones.some((milestone) => milestone.id === 'milestone-early'),
    ).toBe(true);

    confirmSpy.mockReturnValue(true);
    fixture.componentInstance['removeMilestone']('vow-milestones', 'milestone-early');
    expect(
      workspace.vows()[0].milestones.some((milestone) => milestone.id === 'milestone-early'),
    ).toBe(false);
    expect(workspace.progressTracks()[0].ticks).toBe(16);
  });

  it('adds edits cancels and renders long outcome notes without changing status progress or references', () => {
    const original = vowFixture({
      id: 'vow-outcome',
      status: 'fulfilled',
      progressTrackId: 'track-outcome',
      outcome: {
        summary: 'First player resolution.',
        resolvedAt: '2026-07-03T00:00:00.000Z',
        rollId: 'roll-keep',
      },
    });
    const track = progressFixture({ id: 'track-outcome', ticks: 28 });
    workspace.setVows([original]);
    workspace.setProgressTracks([track]);
    createComponent();
    fixture.componentInstance['updateStatusFilter']('fulfilled');
    fixture.detectChanges();

    expect(compiled().textContent).toContain('Outcome notes');
    expect(compiled().textContent).toContain('First player resolution.');
    const editButton = compiled().querySelector<HTMLButtonElement>(
      '[aria-label="Edit outcome notes for Carry word to Hillwatch"]',
    );
    expect(editButton).toBeTruthy();

    fixture.componentInstance['startOutcomeEdit']('vow-outcome', original.outcome?.summary ?? '');
    fixture.componentInstance['updateOutcomeDraft']('vow-outcome', 'Unsaved resolution');
    fixture.componentInstance['cancelOutcomeEdit']('vow-outcome');
    expect(workspace.vows()[0]).toEqual(original);

    const longOutcome = 'Player-authored closing note with details. '.repeat(120);
    fixture.componentInstance['startOutcomeEdit']('vow-outcome', original.outcome?.summary ?? '');
    fixture.componentInstance['updateOutcomeDraft']('vow-outcome', longOutcome);
    fixture.componentInstance['saveOutcome']('vow-outcome');
    fixture.detectChanges();

    const saved = workspace.vows()[0];
    expect(saved).toMatchObject({
      id: original.id,
      title: original.title,
      rank: original.rank,
      status: 'fulfilled',
      notes: original.notes,
      progressTrackId: original.progressTrackId,
      milestones: original.milestones,
      outcome: { summary: longOutcome, rollId: 'roll-keep' },
    });
    expect(saved.outcome?.resolvedAt).toMatch(/T/);
    expect(saved.outcome?.resolvedAt).not.toBe(original.outcome?.resolvedAt);
    expect(workspace.progressTracks()[0]).toEqual(track);
    expect(compiled().textContent).toContain(longOutcome);
  });

  it('offers optional outcome editing after a confirmed terminal status change without requiring notes', () => {
    const original = vowFixture({
      id: 'vow-terminal',
      status: 'active',
      progressTrackId: 'track-terminal',
    });
    const track = progressFixture({ id: 'track-terminal', ticks: 12 });
    workspace.setVows([original]);
    workspace.setProgressTracks([track]);
    createComponent();
    fixture.componentInstance['openVow']('vow-terminal');
    fixture.componentInstance['vowForm'].patchValue({ status: 'forsaken' });
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    fixture.componentInstance['saveVow']();

    expect(confirmSpy).toHaveBeenNthCalledWith(1, 'Mark this vow forsaken?');
    expect(confirmSpy).toHaveBeenNthCalledWith(2, 'Add outcome notes now?');
    expect(workspace.vows()[0].status).toBe('forsaken');
    expect(workspace.vows()[0].outcome).toBeUndefined();
    expect(workspace.progressTracks()[0]).toEqual(track);
  });

  it('offers every supported rank and status from the domain model', () => {
    createComponent();

    expect(
      Array.from(compiled().querySelectorAll<HTMLOptionElement>('#vow-rank option')).map(
        (o) => o.value,
      ),
    ).toEqual(['troublesome', 'dangerous', 'formidable', 'extreme', 'epic']);
    expect(
      Array.from(compiled().querySelectorAll<HTMLOptionElement>('#vow-status option')).map(
        (o) => o.value,
      ),
    ).toEqual(['active', 'fulfilled', 'forsaken', 'archived']);
  });

  it('rejects invalid input with field errors while preserving entered values', () => {
    createComponent();
    fixture.componentInstance['vowForm'].setValue({
      title: '',
      description: 'Do not lose me.',
      rank: 'minor' as never,
      status: 'pending' as never,
      notes: 'Draft note.',
    });
    fixture.componentInstance['saveVow']();
    fixture.detectChanges();

    expect(workspace.vows()).toEqual([]);
    expect(compiled().textContent).toContain('Enter a vow title.');
    expect(compiled().textContent).toContain('Choose a supported rank.');
    expect(compiled().textContent).toContain('Choose a supported status.');
    expect(fixture.componentInstance['vowForm'].getRawValue()).toMatchObject({
      description: 'Do not lose me.',
      notes: 'Draft note.',
    });
    expect(compiled().querySelector('#vow-title')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('cancels and warns before discarding dirty unsaved changes', () => {
    const original = vowFixture({ id: 'vow-safe', title: 'Original title' });
    workspace.setVows([original]);
    createComponent();
    fixture.componentInstance['openVow']('vow-safe');
    fixture.componentInstance['vowForm'].patchValue({ title: 'Unsaved title' });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    fixture.componentInstance['cancelEdit']();
    expect(confirmSpy).toHaveBeenCalledWith('Discard unsaved vow changes?');
    expect(workspace.vows()[0]).toEqual(original);
    expect(fixture.componentInstance['vowForm'].getRawValue().title).toBe('Unsaved title');

    confirmSpy.mockReturnValue(true);
    fixture.componentInstance['cancelEdit']();
    expect(workspace.vows()[0]).toEqual(original);
    expect(fixture.componentInstance['vowForm'].getRawValue().title).toBe('');
  });

  it('renders keyboard-friendly labels, help, responsive controls, and predictable focus targets', () => {
    workspace.setVows([vowFixture({ id: 'vow-access' })]);
    createComponent();

    expect(compiled().querySelector('form[aria-labelledby="vow-editor-title"]')).toBeTruthy();
    expect(compiled().querySelector('#vow-rank')?.getAttribute('aria-describedby')).toContain(
      'vow-rank-help',
    );
    expect(compiled().querySelector('#vow-status')?.getAttribute('aria-describedby')).toContain(
      'vow-status-help',
    );
    expect(
      compiled().querySelector<HTMLButtonElement>(
        '[aria-label="Edit vow: Carry word to Hillwatch"]',
      ),
    ).toBeTruthy();
    expect(compiled().querySelector('.form-actions')).toBeTruthy();
  });
  it('rolls linked vow progress through the workspace and renders accessible mechanical result without mutation', () => {
    const vow = vowFixture({
      id: 'vow-roll-ui',
      title: 'Carry word',
      progressTrackId: 'track-roll-ui',
    });
    const track = progressFixture({ id: 'track-roll-ui', title: 'Carry word track', ticks: 24 });
    workspace.setVows([vow]);
    workspace.setProgressTracks([track]);
    const rollSpy = vi.spyOn(workspace, 'resolveProgressRollForVow').mockReturnValue({
      ok: true,
      value: Object.freeze({
        type: 'progress',
        trackId: 'track-roll-ui',
        progressTrackId: 'track-roll-ui',
        trackTitle: 'Carry word track',
        trackType: 'vow',
        vowId: 'vow-roll-ui',
        vowTitle: 'Carry word',
        progressScore: 6,
        challengeDice: [4, 4] as [number, number],
        challengeResults: [true, true] as [boolean, boolean],
        outcome: 'strong_hit',
        isMatch: true,
        rolledAt: '2026-07-11T00:00:00.000Z',
        source: 'manual',
        trace: ['test fixture'],
      }),
    });
    createComponent();

    const button = compiled().querySelector<HTMLButtonElement>(
      '[aria-label="Roll linked progress for Carry word"]',
    );
    expect(button?.type).toBe('button');
    expect(button?.getAttribute('aria-describedby')).toBe('progress-roll-help-vow-roll-ui');
    button?.click();
    fixture.detectChanges();

    expect(rollSpy).toHaveBeenCalledWith({ vowId: 'vow-roll-ui' });
    expect(compiled().textContent).toContain('Mechanical result');
    expect(compiled().textContent).toContain('6');
    expect(compiled().textContent).toContain('4 and 4');
    expect(compiled().textContent).toContain('strong hit');
    expect(compiled().textContent).toContain('Match');
    expect(compiled().textContent).toContain('Choose any narrative or status changes separately.');
    expect(workspace.vows()[0]).toEqual(vow);
    expect(workspace.progressTracks()[0]).toEqual(track);
  });

  it('prevents rolling broken links and displays safe roll errors with repair navigation', () => {
    workspace.setVows([
      vowFixture({ id: 'vow-broken-ui', title: 'Broken UI', progressTrackId: 'track-missing' }),
    ]);
    createComponent();
    expect(compiled().textContent).toContain('Linked progress track is missing.');
    expect(
      compiled().querySelector<HTMLButtonElement>('.progress-warning + button')?.textContent,
    ).toContain('Remove broken link');
    expect(
      compiled().querySelector('[aria-label="Roll linked progress for Broken UI"]'),
    ).toBeNull();

    workspace.setVows([
      vowFixture({ id: 'vow-error-ui', title: 'Error UI', progressTrackId: 'track-error-ui' }),
    ]);
    workspace.setProgressTracks([progressFixture({ id: 'track-error-ui', ticks: 20 })]);
    vi.spyOn(workspace, 'resolveProgressRollForVow').mockReturnValue({
      ok: false,
      errors: [
        {
          code: 'broken_link',
          field: 'progressTrackId',
          message: 'Linked progress track is missing.',
        },
      ],
    });
    createComponent();
    compiled()
      .querySelector<HTMLButtonElement>('[aria-label="Roll linked progress for Error UI"]')
      ?.click();
    fixture.detectChanges();

    expect(compiled().textContent).toContain('Linked progress track is missing.');
    expect(workspace.progressTracks()[0].ticks).toBe(20);
  });
  it('archives hides from default view and restores the same vow data intact', () => {
    const archivedCandidate = vowFixture({
      id: 'vow-archive',
      title: 'Archive me',
      progressTrackId: 'track-archive',
      milestones: [
        { id: 'milestone-archive', createdAt: '2026-07-02T00:00:00.000Z', note: 'Kept step' },
      ],
      outcome: { summary: 'Kept outcome', resolvedAt: '2026-07-03T00:00:00.000Z' },
    });
    workspace.setVows([archivedCandidate, vowFixture({ id: 'vow-active', title: 'Still active' })]);
    workspace.setProgressTracks([progressFixture({ id: 'track-archive' })]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    createComponent();

    fixture.componentInstance['archiveVow']('vow-archive');
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledWith('Archive this vow? You can restore it later.');
    expect(workspace.vows().find((vow) => vow.id === 'vow-archive')).toMatchObject({
      id: 'vow-archive',
      status: 'archived',
      progressTrackId: 'track-archive',
      milestones: archivedCandidate.milestones,
      outcome: archivedCandidate.outcome,
    });
    expect(compiled().textContent).not.toContain('Archive me');

    fixture.componentInstance['updateStatusFilter']('archived');
    fixture.detectChanges();
    expect(compiled().textContent).toContain('Archive me');

    fixture.componentInstance['restoreVow']('vow-archive');
    fixture.detectChanges();
    const restored = workspace.vows().find((vow) => vow.id === 'vow-archive');
    expect(restored).toMatchObject({
      id: 'vow-archive',
      status: 'active',
      rank: archivedCandidate.rank,
      notes: archivedCandidate.notes,
      description: archivedCandidate.description,
      progressTrackId: 'track-archive',
      milestones: archivedCandidate.milestones,
      outcome: archivedCandidate.outcome,
    });
  });

  it('cancels destructive vow actions without changing vows or linked progress', () => {
    const original = vowFixture({ id: 'vow-cancel-delete', progressTrackId: 'track-cancel' });
    const track = progressFixture({ id: 'track-cancel' });
    workspace.setVows([original]);
    workspace.setProgressTracks([track]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    createComponent();

    fixture.componentInstance['archiveVow']('vow-cancel-delete');
    fixture.componentInstance['deleteVow']('vow-cancel-delete');

    expect(workspace.vows()[0]).toEqual(original);
    expect(workspace.progressTracks()[0]).toEqual(track);
    expect(compiled().textContent).toContain('Carry word to Hillwatch');
  });

  it('warns before deleting data-bearing vows and preserves linked tracks and unrelated data', () => {
    const doomed = vowFixture({
      id: 'vow-delete',
      title: 'Delete selected only',
      progressTrackId: 'track-survives',
      milestones: [
        { id: 'milestone-delete', createdAt: '2026-07-04T00:00:00.000Z', note: 'Delete with vow' },
      ],
      outcome: { summary: 'Delete this outcome', resolvedAt: '2026-07-05T00:00:00.000Z' },
    });
    const unrelated = vowFixture({ id: 'vow-unrelated', title: 'Unrelated remains' });
    const track = progressFixture({ id: 'track-survives' });
    workspace.setVows([doomed, unrelated]);
    workspace.setProgressTracks([track]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    createComponent();

    fixture.componentInstance['deleteVow']('vow-delete');

    expect(confirmSpy.mock.calls.at(-1)?.[0]).toContain(
      'This vow has a linked progress track. The track will remain.',
    );
    expect(confirmSpy.mock.calls.at(-1)?.[0]).toContain('This vow has milestone notes.');
    expect(confirmSpy.mock.calls.at(-1)?.[0]).toContain('This vow has notes.');
    expect(confirmSpy.mock.calls.at(-1)?.[0]).toContain('This vow has outcome data.');
    expect(workspace.vows()).toEqual([unrelated]);
    expect(workspace.progressTracks()).toEqual([track]);
  });

  it('handles stale delete requests safely and returns focus after cancel', async () => {
    workspace.setVows([vowFixture({ id: 'vow-stale', title: 'Stale target' })]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    createComponent();
    fixture.detectChanges();

    const deleteButton = compiled().querySelector<HTMLButtonElement>('#vow-delete-vow-stale');
    deleteButton?.focus();
    fixture.componentInstance['deleteVow']('vow-stale');
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

    expect(document.activeElement).toBe(deleteButton);
    workspace.clearVows();
    fixture.componentInstance['deleteVow']('vow-stale');
    expect(fixture.componentInstance['formMessage']).toBe('Vow was not found.');
  });
});
