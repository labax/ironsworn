import { ComponentFixture, TestBed } from '@angular/core/testing';

import { createDefaultProgressTrack, type ProgressTrack } from '@app/domain/progress';
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
    await TestBed.configureTestingModule({ imports: [Trackers] }).compileComponents();
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

    const buttons = compiled().querySelectorAll<HTMLButtonElement>('.track-card button');
    buttons[1].click();
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
});
