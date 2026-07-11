import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { createDefaultProgressTrack, type ProgressTrack } from '@app/domain/progress';
import { createDefaultVow, type Vow } from '@app/domain/vows';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';

import { Vows } from './vows';

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
    await TestBed.configureTestingModule({ imports: [Vows] }).compileComponents();
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

  it('lists active vows first with deterministic timestamp and stable-id ordering', () => {
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

    const titles = Array.from(compiled().querySelectorAll('.vow-title-block h3')).map((node) =>
      node.textContent?.trim(),
    );
    expect(titles).toEqual(['First active', 'Second active', 'Past promise']);
    expect(compiled().textContent).toContain(
      'Active vows are listed first; other statuses follow by latest timestamp, then stable ID.',
    );
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
});
