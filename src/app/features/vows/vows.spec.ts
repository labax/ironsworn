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
        { id: 'milestone-1', title: 'First step', createdAt: '2026-07-02T00:00:00.000Z' },
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
    fixture.componentInstance['saveVow']();

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
