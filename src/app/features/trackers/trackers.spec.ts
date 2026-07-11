import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { rulesFailure, rulesSuccess } from '@app/rules/validation';

import { createDefaultProgressTrack, type ProgressTrack } from '@app/domain/progress';
import { createDefaultVow } from '@app/domain/vows';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';

import { Trackers } from './trackers';

const progressTrack = (overrides: Partial<ProgressTrack> = {}): ProgressTrack => ({
  ...createDefaultProgressTrack({
    id: 'track-default',
    createdAt: '2026-07-01T00:00:00.000Z',
    title: 'Find the hidden ford',
    type: 'journey',
    rank: 'dangerous',
  }),
  ...overrides,
});

describe('Trackers', () => {
  let fixture: ComponentFixture<Trackers>;
  let workspace: CampaignWorkspaceService;

  const createComponent = () => {
    fixture = TestBed.createComponent(Trackers);
    fixture.detectChanges();
  };

  const compiled = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await TestBed.configureTestingModule({
      imports: [Trackers],
      providers: [provideRouter([])],
    }).compileComponents();
    workspace = TestBed.inject(CampaignWorkspaceService);
    workspace.clearProgressTracks();
  });

  it('shows an empty state with a create entry point when there are no tracks', () => {
    createComponent();

    expect(compiled().textContent).toContain('No progress tracks yet.');
    expect(compiled().querySelectorAll('.track-card')).toHaveLength(0);
    expect(compiled().querySelector('button[aria-label="Create a progress track"]')).toBeTruthy();
  });

  it('renders populated tracks with title, type, status, rank, progress, notes, and labels', () => {
    workspace.setProgressTracks([
      progressTrack({
        id: 'track-vow',
        title: 'Swear to guide Renna home',
        type: 'vow',
        rank: 'formidable',
        ticks: 12,
        status: 'active',
        notes: 'Renna carries the last map shard.',
      }),
      progressTrack({
        id: 'track-combat',
        title: 'Hold the bridge line',
        type: 'combat',
        rank: 'troublesome',
        ticks: 4,
        status: 'completed',
      }),
    ]);

    createComponent();

    const text = compiled().textContent ?? '';
    expect(text).toContain('Swear to guide Renna home');
    expect(text).toContain('Type');
    expect(text).toContain('Vow');
    expect(text).toContain('Status: Active');
    expect(text).toContain('Formidable');
    expect(text).toContain('12 progress ticks');
    expect(text).toContain('Renna carries the last map shard.');
    expect(text).toContain('Hold the bridge line');
    expect(text).toContain('Combat');
    expect(text).toContain('Completed');
    expect(compiled().querySelector('[aria-label="Progress tracks"]')).toBeTruthy();
    expect(
      compiled().querySelector('[aria-label="Open progress track: Swear to guide Renna home"]'),
    ).toBeTruthy();
  });

  it('opens the correct record by stable ID', () => {
    workspace.setProgressTracks([
      progressTrack({ id: 'track-first', title: 'First trail' }),
      progressTrack({ id: 'track-second', title: 'Second trail' }),
    ]);
    createComponent();

    compiled()
      .querySelector<HTMLButtonElement>('[aria-label="Open progress track: Second trail"]')
      ?.click();
    fixture.detectChanges();

    expect(workspace.selectedProgressTrackId()).toBe('track-second');
    expect(workspace.selectedProgressTrack()?.title).toBe('Second trail');
    expect(compiled().querySelectorAll('.track-card')[1].classList).toContain(
      'track-card-selected',
    );
  });

  it('keeps deterministic ordering by creation date and then ID', () => {
    workspace.setProgressTracks([
      progressTrack({ id: 'track-c', title: 'Third shown', createdAt: '2026-07-03T00:00:00.000Z' }),
      progressTrack({
        id: 'track-b',
        title: 'Second shown',
        createdAt: '2026-07-02T00:00:00.000Z',
      }),
      progressTrack({ id: 'track-a', title: 'First shown', createdAt: '2026-07-02T00:00:00.000Z' }),
    ]);

    createComponent();

    const titles = Array.from(compiled().querySelectorAll('.track-title-block h3')).map((heading) =>
      heading.textContent?.trim(),
    );
    expect(titles).toEqual(['First shown', 'Second shown', 'Third shown']);
  });

  it('renders incomplete optional fields and long user-authored content without undefined text', () => {
    const longTitle = 'Cross the whispering salt flats '.repeat(8);
    const longNotes = 'Watch for glass reeds and keep the lantern covered. '.repeat(8);
    workspace.setProgressTracks([
      progressTrack({
        id: 'track-incomplete',
        title: longTitle,
        rank: undefined,
        notes: longNotes,
        ticks: Number.NaN,
      } as unknown as Partial<ProgressTrack>),
    ]);

    createComponent();

    const text = compiled().textContent ?? '';
    expect(text).toContain(longTitle.trim());
    expect(text).toContain(longNotes.trim());
    expect(text).toContain('0 progress ticks');
    expect(text).not.toContain('undefined');
    expect(compiled().querySelector('.track-notes')).toBeTruthy();
  });
  it('creates every supported type and rank from accessible selectors', () => {
    createComponent();
    const component = fixture.componentInstance as unknown as {
      trackForm: {
        setValue(value: { title: string; type: string; rank: string; notes: string }): void;
      };
      saveTrack(): void;
    };
    const types = ['vow', 'journey', 'combat', 'bond', 'custom'];
    const ranks = ['troublesome', 'dangerous', 'formidable', 'extreme', 'epic'];

    types.forEach((type, index) => {
      fixture.componentInstance['openCreate']();
      component.trackForm.setValue({
        title: `User authored ${type}`,
        type,
        rank: ranks[index],
        notes: type === 'custom' ? 'User-authored custom note' : '',
      });
      component.saveTrack();
    });
    fixture.detectChanges();

    expect(workspace.progressTracks().map((track) => track.type)).toEqual(
      expect.arrayContaining(types),
    );
    expect(workspace.progressTracks().map((track) => track.rank)).toEqual(
      expect.arrayContaining(ranks),
    );
    expect(compiled().querySelector('#track-type')?.tagName).toBe('SELECT');
    expect(compiled().querySelector('#track-rank')?.tagName).toBe('SELECT');
    expect(compiled().querySelector('#track-type')?.getAttribute('aria-describedby')).toContain(
      'track-type-help',
    );
    expect(compiled().querySelector('#track-rank')?.getAttribute('aria-describedby')).toContain(
      'track-rank-help',
    );
  });

  it('edits type and rank with explicit rank-change confirmation and preserves progress and metadata', () => {
    const track = progressTrack({
      id: 'track-edit',
      title: 'Original custom name',
      type: 'vow',
      rank: 'dangerous',
      ticks: 16,
      notes: 'Keep note',
      events: [{ id: 'event-1', createdAt: '2026-07-01T00:00:00.000Z', ticksDelta: 4 }],
    });
    const unrelated = progressTrack({ id: 'track-other', title: 'Other', ticks: 8 });
    workspace.setProgressTracks([track, unrelated]);
    createComponent();
    fixture.componentInstance['openTrack']('track-edit');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    fixture.componentInstance['trackForm'].setValue({
      title: 'Changed custom name',
      type: 'custom',
      rank: 'epic',
      notes: 'Keep note updated',
    });
    fixture.componentInstance['saveTrack']();

    expect(workspace.selectedProgressTrack()).toMatchObject({
      type: 'vow',
      rank: 'dangerous',
      ticks: 16,
    });
    expect(fixture.componentInstance['formMessage']).toContain('canceled');

    confirmSpy.mockReturnValue(true);
    fixture.componentInstance['saveTrack']();
    const saved = workspace.selectedProgressTrack();

    expect(confirmSpy).toHaveBeenCalledWith(
      'Changing rank keeps current progress ticks. No recalculation will be made.',
    );
    expect(saved).toMatchObject({
      id: 'track-edit',
      title: 'Changed custom name',
      type: 'custom',
      rank: 'epic',
      ticks: 16,
      notes: 'Keep note updated',
      status: 'active',
    });
    expect(saved?.events).toEqual(track.events);
    expect(workspace.progressTracks().find((candidate) => candidate.id === 'track-other')).toEqual(
      unrelated,
    );
  });

  it('rejects invalid type and rank with field-associated feedback', () => {
    createComponent();
    fixture.componentInstance['trackForm'].setValue({
      title: 'Invalid classification',
      type: 'ritual' as never,
      rank: 'minor' as never,
      notes: '',
    });
    fixture.componentInstance['saveTrack']();
    fixture.detectChanges();

    expect(workspace.progressTracks()).toEqual([]);
    expect(compiled().textContent).toContain('Choose a supported track type.');
    expect(compiled().textContent).toContain('Choose a supported rank.');
    expect(compiled().querySelector('#track-type')?.getAttribute('aria-invalid')).toBe('true');
    expect(compiled().querySelector('#track-rank')?.getAttribute('aria-invalid')).toBe('true');
  });
  it('marks and removes progress on only the selected track with accessible announcements', () => {
    const selected = progressTrack({ id: 'track-mark', rank: 'dangerous', ticks: 8 });
    const unrelated = progressTrack({
      id: 'track-safe',
      title: 'Safe',
      ticks: 12,
      notes: 'Keep me',
    });
    workspace.setProgressTracks([selected, unrelated]);
    createComponent();

    compiled()
      .querySelector<HTMLButtonElement>('[aria-label="Mark progress on Find the hidden ford"]')
      ?.click();
    fixture.detectChanges();

    expect(workspace.progressTracks().find((track) => track.id === 'track-mark')?.ticks).toBe(16);
    expect(workspace.progressTracks().find((track) => track.id === 'track-safe')).toEqual(
      unrelated,
    );
    expect(compiled().textContent).toContain('Progress marked. 16 ticks, score 4.');
    expect(compiled().textContent).toContain('16 progress ticks · Score 4');

    compiled()
      .querySelector<HTMLButtonElement>('[aria-label="Remove progress from Find the hidden ford"]')
      ?.click();
    fixture.detectChanges();

    expect(workspace.progressTracks().find((track) => track.id === 'track-mark')?.ticks).toBe(8);
    expect(compiled().textContent).toContain('Progress removed. 8 ticks, score 2.');
  });

  it('rolls progress from the current track snapshot and displays structured mechanical data without mutation', () => {
    const track = progressTrack({ id: 'track-roll', ticks: 24, notes: 'Keep note' });
    const unrelated = progressTrack({ id: 'track-other', title: 'Other', ticks: 8 });
    workspace.setProgressTracks([track, unrelated]);
    const rollSpy = vi.spyOn(workspace, 'resolveProgressRollForTrack').mockReturnValue(
      rulesSuccess(
        Object.freeze({
          type: 'progress' as const,
          trackId: 'track-roll',
          rolledAt: '2026-07-11T00:00:00.000Z',
          source: 'generated' as const,
          progressScore: 6,
          challengeDice: [4, 4] as const,
          outcome: 'strong_hit' as const,
          challengeResults: [true, true] as const,
          isMatch: true,
          trace: ['test'],
        }),
      ),
    );
    createComponent();

    const button = compiled().querySelector<HTMLButtonElement>(
      '[aria-label="Roll progress for Find the hidden ford"]',
    );
    button?.focus();
    button?.click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(button);
    expect(rollSpy).toHaveBeenCalledWith('track-roll');
    expect(compiled().textContent).toContain(
      'Progress roll: score 6 vs 4 and 4 — strong hit, match.',
    );
    expect(compiled().textContent).toContain('Progress roll result');
    expect(compiled().textContent).toContain('Challenge dice');
    expect(compiled().textContent).toContain('Match');
    expect(workspace.progressTracks().find((candidate) => candidate.id === 'track-roll')).toEqual(
      track,
    );
    expect(workspace.progressTracks().find((candidate) => candidate.id === 'track-other')).toEqual(
      unrelated,
    );
  });

  it('shows recoverable errors for missing, stale, or malformed tracks', () => {
    const track = progressTrack({ id: 'track-roll-errors', ticks: 12 });
    workspace.setProgressTracks([track]);
    createComponent();

    const staleButton = compiled().querySelector<HTMLButtonElement>(
      '[aria-label="Roll progress for Find the hidden ford"]',
    );
    workspace.setProgressTracks([{ ...track, ticks: 16, updatedAt: '2026-07-02T00:00:00.000Z' }]);
    staleButton?.click();
    fixture.detectChanges();
    expect(compiled().textContent).toContain(
      'Progress roll unavailable because this track snapshot is stale.',
    );

    const malformed = progressTrack({ id: 'track-malformed', ticks: Number.NaN });
    workspace.setProgressTracks([malformed as ProgressTrack]);
    fixture.componentInstance['rollProgress'](malformed as ProgressTrack);
    fixture.detectChanges();
    expect(compiled().textContent).toContain('ticks must be a finite number.');

    const missing = progressTrack({ id: 'track-missing' });
    const rollSpy = vi
      .spyOn(workspace, 'resolveProgressRollForTrack')
      .mockReturnValue(
        rulesFailure([
          { code: 'not_found', field: 'trackId', message: 'Progress track was not found.' },
        ]),
      );
    workspace.setProgressTracks([missing]);
    fixture.componentInstance['rollProgress'](missing);
    fixture.detectChanges();
    expect(rollSpy).toHaveBeenCalledWith('track-missing');
    expect(compiled().textContent).toContain('Progress track was not found.');
  });

  it('disables normal controls at boundaries with non-color helper text', () => {
    workspace.setProgressTracks([
      progressTrack({ id: 'track-full', title: 'Full', rank: 'troublesome', ticks: 36 }),
      progressTrack({ id: 'track-empty', title: 'Empty', rank: 'dangerous', ticks: 4 }),
    ]);
    createComponent();

    expect(
      compiled().querySelector<HTMLButtonElement>('[aria-label="Mark progress on Full"]')?.disabled,
    ).toBe(true);
    expect(
      compiled().querySelector<HTMLButtonElement>('[aria-label="Remove progress from Empty"]')
        ?.disabled,
    ).toBe(true);
    expect(compiled().textContent).toContain('Marking would exceed 40 ticks.');
    expect(compiled().textContent).toContain('Removing would go below 0 ticks.');
  });

  it('applies direct correction with destructive confirmation and preserves unrelated data', () => {
    const track = progressTrack({ id: 'track-correct', ticks: 20, notes: 'Keep note' });
    const unrelated = progressTrack({ id: 'track-other', title: 'Other', ticks: 8 });
    workspace.setProgressTracks([track, unrelated]);
    createComponent();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const input = compiled().querySelector<HTMLInputElement>(
      '[aria-label="Correct progress ticks for Find the hidden ford"]',
    );
    expect(input).toBeTruthy();
    input!.value = '12';

    compiled().querySelectorAll<HTMLButtonElement>('.progress-controls button')[3].click();
    fixture.detectChanges();

    expect(
      workspace.progressTracks().find((candidate) => candidate.id === 'track-correct')?.ticks,
    ).toBe(20);
    expect(compiled().textContent).toContain(
      'Progress correction canceled; progress was preserved.',
    );

    confirmSpy.mockReturnValue(true);
    compiled().querySelectorAll<HTMLButtonElement>('.progress-controls button')[3].click();
    fixture.detectChanges();

    expect(
      workspace.progressTracks().find((candidate) => candidate.id === 'track-correct'),
    ).toMatchObject({
      id: 'track-correct',
      ticks: 12,
      notes: 'Keep note',
      status: 'active',
    });
    expect(workspace.progressTracks().find((candidate) => candidate.id === 'track-other')).toEqual(
      unrelated,
    );
  });

  it('requires confirmation for manual correction outside normal bounds without clamping confirmed values', () => {
    workspace.setProgressTracks([progressTrack({ id: 'track-override', ticks: 40 })]);
    createComponent();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const input = compiled().querySelector<HTMLInputElement>(
      '[aria-label="Correct progress ticks for Find the hidden ford"]',
    );
    input!.value = '44';

    compiled().querySelectorAll<HTMLButtonElement>('.progress-controls button')[3].click();
    fixture.detectChanges();

    expect(workspace.progressTracks().find((track) => track.id === 'track-override')?.ticks).toBe(
      40,
    );
    expect(compiled().textContent).toContain('Manual correction canceled; progress was preserved.');

    confirmSpy.mockReturnValue(true);
    compiled().querySelectorAll<HTMLButtonElement>('.progress-controls button')[3].click();
    fixture.detectChanges();

    expect(workspace.progressTracks().find((track) => track.id === 'track-override')?.ticks).toBe(
      44,
    );
    expect(compiled().textContent).toContain(
      'Manual progress correction applied. 44 ticks, score 10.',
    );
  });
  it('visibly identifies override mode and requires confirmation to return to standard mode', () => {
    workspace.setProgressTracks([
      progressTrack({ id: 'track-override', ticks: 44, progressMode: 'manual_override' }),
    ]);
    createComponent();

    expect(compiled().textContent).toContain('Manual override active');
    expect(
      compiled().querySelector<HTMLButtonElement>(
        '[aria-label="Mark progress on Find the hidden ford"]',
      )?.disabled,
    ).toBe(true);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    compiled().querySelectorAll<HTMLButtonElement>('.progress-controls button')[4].click();
    fixture.detectChanges();
    expect(workspace.progressTracks()[0]?.progressMode).toBe('manual_override');
    expect(compiled().textContent).toContain('Return to standard mode canceled');

    confirmSpy.mockReturnValue(true);
    compiled().querySelector<HTMLInputElement>(
      '[aria-label="Correct progress ticks for Find the hidden ford"]',
    )!.value = '40';
    compiled().querySelectorAll<HTMLButtonElement>('.progress-controls button')[3].click();
    fixture.detectChanges();
    expect(workspace.progressTracks()[0]).toMatchObject({ ticks: 40, progressMode: 'standard' });
  });

  it('keeps invalid correction drafts out of committed state and preserves unrelated tracks', () => {
    const track = progressTrack({ id: 'track-invalid', ticks: 12 });
    const unrelated = progressTrack({ id: 'track-other', title: 'Other', ticks: 8 });
    workspace.setProgressTracks([track, unrelated]);
    createComponent();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const input = compiled().querySelector<HTMLInputElement>(
      '[aria-label="Correct progress ticks for Find the hidden ford"]',
    );
    input!.value = 'not a number';
    compiled().querySelectorAll<HTMLButtonElement>('.progress-controls button')[3].click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalled();
    expect(input!.value).toBe('not a number');
    expect(
      workspace.progressTracks().find((candidate) => candidate.id === 'track-invalid'),
    ).toEqual(track);
    expect(workspace.progressTracks().find((candidate) => candidate.id === 'track-other')).toEqual(
      unrelated,
    );
    expect(compiled().textContent).toContain('ticks must be a finite number.');
  });

  it('keeps archived tracks out of the active view and restores them intact from the archived view', () => {
    const archived = progressTrack({
      id: 'track-archived',
      title: 'Archived path',
      status: 'archived',
      ticks: 20,
      notes: 'Restore this note.',
    });
    const active = progressTrack({ id: 'track-active', title: 'Active path' });
    workspace.setProgressTracks([archived, active]);
    createComponent();

    expect(compiled().textContent).toContain('Active path');
    expect(compiled().textContent).not.toContain('Archived path');

    fixture.componentInstance['showArchivedTracks']();
    fixture.detectChanges();
    expect(compiled().textContent).toContain('Archived path');
    expect(compiled().textContent).not.toContain('Active path');

    compiled()
      .querySelector<HTMLButtonElement>('[aria-label="Restore progress track: Archived path"]')
      ?.click();
    fixture.detectChanges();

    const restored = workspace.progressTracks().find((track) => track.id === 'track-archived');
    expect(restored).toMatchObject({
      id: archived.id,
      status: 'active',
      ticks: 20,
      notes: archived.notes,
    });
  });

  it('requires archive confirmation and leaves state unchanged when canceled', () => {
    const track = progressTrack({ id: 'track-cancel-archive', title: 'Archive cancel' });
    workspace.setProgressTracks([track]);
    createComponent();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    compiled()
      .querySelector<HTMLButtonElement>('[aria-label="Archive progress track: Archive cancel"]')
      ?.click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Archive this progress track?'),
    );
    expect(workspace.progressTracks()).toEqual([track]);
    expect(fixture.componentInstance['progressMessage']).toContain('Archive canceled');
  });

  it('warns about linked vows, notes, and progress before confirmed delete without altering the vow', () => {
    const track = progressTrack({
      id: 'track-delete-ui',
      title: 'Delete with warnings',
      ticks: 12,
      notes: 'Player note.',
    });
    const vow = createDefaultVow({
      id: 'vow-linked-ui',
      createdAt: '2026-07-01T00:00:00.000Z',
      title: 'Linked player vow',
      rank: 'dangerous',
      progressTrackId: track.id,
    });
    workspace.setProgressTracks([track]);
    workspace.setVows([vow]);
    createComponent();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    compiled()
      .querySelector<HTMLButtonElement>(
        '[aria-label="Delete progress track: Delete with warnings"]',
      )
      ?.click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Linked vow'));
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('marked progress'));
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('user-authored notes'));
    expect(workspace.progressTracks()).toEqual([]);
    expect(workspace.vows()).toEqual([vow]);
  });

  it('cancels delete without mutation and returns focus to the action control when it remains', async () => {
    const track = progressTrack({ id: 'track-delete-cancel', title: 'Delete cancel' });
    workspace.setProgressTracks([track]);
    createComponent();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const deleteButton = compiled().querySelector<HTMLButtonElement>(
      '[aria-label="Delete progress track: Delete cancel"]',
    );
    deleteButton?.focus();

    deleteButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(workspace.progressTracks()).toEqual([track]);
    expect(document.activeElement).toBe(deleteButton);
    expect(fixture.componentInstance['progressMessage']).toContain('Delete canceled');
  });

  it('provides programmatic names and error associations for editor and progress controls', () => {
    workspace.setProgressTracks([progressTrack({ id: 'track-a11y', title: 'Named controls' })]);
    createComponent();

    expect(compiled().querySelector('form')?.getAttribute('aria-describedby')).toContain(
      'track-editor-help',
    );
    expect(compiled().querySelector('#track-title')?.getAttribute('aria-describedby')).toBe(
      'track-title-error',
    );
    expect(compiled().querySelector('#track-notes')?.getAttribute('aria-describedby')).toBe(
      'track-notes-help',
    );
    expect(
      compiled().querySelector('[aria-label="Progress actions for Named controls"]'),
    ).toBeTruthy();
    expect(
      compiled().querySelector('[aria-label="Apply progress correction for Named controls"]'),
    ).toBeTruthy();
    expect(
      compiled()
        .querySelector('[aria-label="Correct progress ticks for Named controls"]')
        ?.getAttribute('aria-describedby'),
    ).toContain('progress-error-track-a11y');
  });

  it('returns focus to the editor name when creating, opening, and saving tracks', async () => {
    workspace.setProgressTracks([progressTrack({ id: 'track-focus', title: 'Focus target' })]);
    createComponent();

    fixture.componentInstance['openTrack']('track-focus');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(compiled().querySelector('#track-title'));

    fixture.componentInstance['trackForm'].setValue({
      title: 'Focus target updated',
      type: 'journey',
      rank: 'dangerous',
      notes: '',
    });
    fixture.componentInstance['saveTrack']();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(compiled().querySelector('#track-title'));

    fixture.componentInstance['openCreate']();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(compiled().querySelector('#track-title'));
  });

  it('keeps long content in semantic wrapping containers for responsive layouts', () => {
    const longTitle = 'A-very-long-unbroken-title-without-natural-breakpoints-'.repeat(6);
    const longNotes = 'LongNoteWithoutSpaces'.repeat(20);
    workspace.setProgressTracks([
      progressTrack({ id: 'track-long-responsive', title: longTitle, notes: longNotes }),
    ]);
    createComponent();

    expect(compiled().querySelector('.track-card')?.className).toContain('track-card');
    expect(compiled().querySelector('.track-title-block h3')?.textContent).toContain(longTitle);
    expect(compiled().querySelector('.track-notes')?.textContent).toContain(longNotes);
    expect(compiled().querySelector('.progress-boxes')?.getAttribute('aria-label')).toContain(
      'progress ticks',
    );
  });
});
