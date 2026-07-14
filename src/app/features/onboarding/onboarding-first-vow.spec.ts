import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { OnboardingStateService } from '@app/domain/onboarding';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { createDefaultProgressTrack } from '@app/domain/progress';
import { createDefaultVow } from '@app/domain/vows';
import { OnboardingFirstVow } from './onboarding-first-vow';

const makeVow = (id = 'vow-first') =>
  createDefaultVow({
    id,
    createdAt: '2026-07-14T00:00:00.000Z',
    title: 'Guard the ford',
    rank: 'dangerous',
    description: 'User-authored context.',
    notes: 'User-authored note.',
  });

describe('OnboardingFirstVow', () => {
  let fixture: ComponentFixture<OnboardingFirstVow>;
  let saveVow: ReturnType<typeof vi.fn>;
  let createProgressTrackForVow: ReturnType<typeof vi.fn>;
  let deleteVow: ReturnType<typeof vi.fn>;
  let vows: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let draft: unknown;
  let committedId: string | null;
  let completeFirstVow: ReturnType<typeof vi.fn>;

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingFirstVow],
      providers: [
        provideRouter([]),
        {
          provide: CampaignWorkspaceService,
          useValue: { saveVow, createProgressTrackForVow, deleteVow, vows },
        },
        {
          provide: OnboardingStateService,
          useValue: {
            firstVowDraft: () => draft,
            updateFirstVowDraft: vi.fn((value) => (draft = value)),
            firstVowCommittedId: () => committedId,
            markFirstVowCommitted: vi.fn((id) => (committedId = id)),
            completeFirstVow,
            previousStep: () => ({ id: 'character', path: '/character' }),
            nextStep: () => ({ id: 'done', path: '/moves' }),
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(Router).navigate = navigate as unknown as Router['navigate'];
    fixture = TestBed.createComponent(OnboardingFirstVow);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    const vow = makeVow();
    const track = createDefaultProgressTrack({
      id: 'track-first',
      createdAt: '2026-07-14T00:00:00.000Z',
      title: vow.title,
      type: 'vow',
      rank: vow.rank,
    });
    saveVow = vi.fn().mockReturnValue({ ok: true, vow });
    createProgressTrackForVow = vi
      .fn()
      .mockReturnValue({ ok: true, vow: { ...vow, progressTrackId: track.id }, track });
    deleteVow = vi.fn().mockReturnValue({ ok: true, vow });
    vows = vi.fn().mockReturnValue([]);
    navigate = vi.fn().mockResolvedValue(true);
    draft = null;
    committedId = null;
    completeFirstVow = vi.fn().mockResolvedValue({ success: true });
  });

  it('creates a valid first vow once with selected rank and optional user fields', async () => {
    await create();
    fixture.componentInstance['vowForm'].setValue({
      title: 'Guard the ford',
      description: 'User-authored context.',
      rank: 'dangerous',
      notes: 'User-authored note.',
    });

    await fixture.componentInstance['continue']();
    await fixture.componentInstance['continue']();

    expect(saveVow).toHaveBeenCalledTimes(1);
    expect(saveVow).toHaveBeenCalledWith({
      title: 'Guard the ford',
      description: 'User-authored context.',
      rank: 'dangerous',
      notes: 'User-authored note.',
      status: 'active',
    });
    expect(createProgressTrackForVow).toHaveBeenCalledTimes(1);
    expect(createProgressTrackForVow).toHaveBeenCalledWith({ vowId: 'vow-first' });
    expect(completeFirstVow).toHaveBeenCalledWith('vow-first');
    expect(navigate).toHaveBeenCalledWith(['/moves']);
  });

  it('shows required title validation and preserves entered fields', async () => {
    await create();
    fixture.componentInstance['vowForm'].setValue({
      title: ' ',
      description: 'Keep this description.',
      rank: 'formidable',
      notes: 'Keep this note.',
    });

    await fixture.componentInstance['continue']();
    fixture.detectChanges();

    expect(saveVow).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter a vow title.');
    expect(fixture.componentInstance['vowForm'].getRawValue()).toMatchObject({
      description: 'Keep this description.',
      rank: 'formidable',
      notes: 'Keep this note.',
    });
  });

  it('uses shared Vow validation for invalid ranks and associates field feedback', async () => {
    saveVow = vi.fn().mockReturnValue({
      ok: false,
      errors: [{ code: 'unsupported_rank', field: 'rank', message: 'Choose a supported rank.' }],
    });
    await create();
    fixture.componentInstance['vowForm'].setValue({
      title: 'Valid title',
      description: '',
      rank: 'minor' as never,
      notes: '',
    });

    await fixture.componentInstance['continue']();
    fixture.detectChanges();

    const rank = (fixture.nativeElement as HTMLElement).querySelector('#vow-rank');
    expect(rank?.getAttribute('aria-invalid')).toBe('true');
    expect(rank?.getAttribute('aria-describedby')).toContain('vow-rank-error');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Choose a supported rank.',
    );
  });

  it('preserves draft on Back and reuses draft when returning', async () => {
    await create();
    fixture.componentInstance['vowForm'].setValue({
      title: 'Remember the bridge',
      description: 'Draft description.',
      rank: 'extreme',
      notes: 'Draft notes.',
    });

    await fixture.componentInstance['back']();
    expect(navigate).toHaveBeenCalledWith(['/character']);

    TestBed.resetTestingModule();
    await create();
    expect(fixture.componentInstance['vowForm'].getRawValue()).toEqual({
      title: 'Remember the bridge',
      description: 'Draft description.',
      rank: 'extreme',
      notes: 'Draft notes.',
    });
  });

  it('guards repeated Continue after a committed id by using application state instead of duplicating', async () => {
    const vow = makeVow('vow-existing');
    committedId = 'vow-existing';
    vows = vi.fn().mockReturnValue([vow]);
    await create();
    fixture.componentInstance['vowForm'].setValue({
      title: 'Changed',
      description: '',
      rank: 'epic',
      notes: '',
    });

    await fixture.componentInstance['continue']();

    expect(saveVow).not.toHaveBeenCalled();
    expect(createProgressTrackForVow).toHaveBeenCalledWith({ vowId: 'vow-existing' });
    expect(completeFirstVow).not.toHaveBeenCalled();
  });

  it('renders the linked zero-progress review before final navigation without exposing ids', async () => {
    await create();
    fixture.componentInstance['vowForm'].setValue({
      title: 'Guard the ford',
      description: 'User-authored context.',
      rank: 'dangerous',
      notes: 'User-authored note.',
    });

    await fixture.componentInstance['continue']();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Review your first vow track');
    expect(text).toContain('Guard the ford');
    expect(text).toContain('Dangerous');
    expect(text).toContain('Vow');
    expect(text).toContain('0 ticks');
    expect(text).toContain('Vow and progress track are linked.');
    expect(text).not.toContain('track-first');
    expect(navigate).not.toHaveBeenCalled();

    await fixture.componentInstance['continue']();
    expect(navigate).toHaveBeenCalledWith(['/moves']);
  });

  it('rolls back the created vow when linked track creation fails', async () => {
    createProgressTrackForVow = vi.fn().mockReturnValue({
      ok: false,
      errors: [{ code: 'unsupported_rank', field: 'rank', message: 'Choose a supported rank.' }],
    });
    await create();
    fixture.componentInstance['vowForm'].setValue({
      title: 'Guard the ford',
      description: '',
      rank: 'dangerous',
      notes: '',
    });

    await fixture.componentInstance['continue']();

    expect(deleteVow).toHaveBeenCalledWith('vow-first');
    expect(completeFirstVow).not.toHaveBeenCalled();
  });

  it('keeps responsive and keyboard-friendly structure with focused, labelled fields', async () => {
    await create();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.first-vow-card')).toBeTruthy();
    expect(element.querySelector('form')?.getAttribute('aria-labelledby')).toBeNull();
    expect(element.querySelector('#vow-title')?.getAttribute('aria-describedby')).toContain(
      'vow-title-help',
    );
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Create track');
    expect(element.querySelector('button.secondary')?.textContent).toContain('Back');
  });
});
