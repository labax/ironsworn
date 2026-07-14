import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ActiveCharacterService, createDefaultCharacter } from '@app/domain/character';
import { OnboardingStateService } from '@app/domain/onboarding';
import { createDefaultProgressTrack } from '@app/domain/progress';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { createDefaultVow } from '@app/domain/vows';
import { OnboardingReview } from './onboarding-review';

const character = createDefaultCharacter({
  id: 'character-1',
  createdAt: '2026-07-14T00:00:00.000Z',
  name: 'Vale',
  concept: 'Storm watcher',
});
const track = createDefaultProgressTrack({
  id: 'track-first',
  createdAt: '2026-07-14T00:00:00.000Z',
  title: 'Guard the ford',
  type: 'vow',
  rank: 'dangerous',
});
const vow = createDefaultVow({
  id: 'vow-first',
  createdAt: '2026-07-14T00:00:00.000Z',
  title: 'Guard the ford',
  rank: 'dangerous',
  progressTrackId: track.id,
  description: 'User-authored context.',
});

describe('OnboardingReview', () => {
  let fixture: ComponentFixture<OnboardingReview>;
  let completeOnboardingTransaction: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let exitSetup: ReturnType<typeof vi.fn>;

  const create = async (
    options: { complete?: unknown; vows?: unknown[]; tracks?: unknown[] } = {},
  ) => {
    completeOnboardingTransaction = vi.fn().mockResolvedValue(options.complete ?? { ok: true });
    navigate = vi.fn().mockResolvedValue(true);
    exitSetup = vi.fn().mockResolvedValue({ success: true });
    await TestBed.configureTestingModule({
      imports: [OnboardingReview],
      providers: [
        provideRouter([]),
        { provide: ActiveCharacterService, useValue: { activeCharacter: () => character } },
        {
          provide: CampaignWorkspaceService,
          useValue: {
            vows: () => options.vows ?? [vow],
            progressTracks: () => options.tracks ?? [track],
          },
        },
        { provide: OnboardingStateService, useValue: { completeOnboardingTransaction, exitSetup } },
      ],
    }).compileComponents();
    TestBed.inject(Router).navigate = navigate as unknown as Router['navigate'];
    fixture = TestBed.createComponent(OnboardingReview);
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('reviews character, starting tracks, first vow, linked progress, and completes once', async () => {
    await create();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Vale');
    expect(text).toContain('Health 5, Spirit 5, Supply 5');
    expect(text).toContain('2 (reset 2, max 10)');
    expect(text).toContain('Guard the ford');
    expect(text).toContain('Dangerous');
    expect(text).toContain('0 ticks');

    await fixture.componentInstance['complete']();
    await fixture.componentInstance['complete']();

    expect(completeOnboardingTransaction).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/moves']);
  });

  it('blocks and preserves review data when validation or save fails with section edit links', async () => {
    await create({
      complete: {
        ok: false,
        message: 'Complete the highlighted setup sections, then try again.',
        errors: [
          { section: 'progress track', message: 'The linked vow progress track is missing.' },
        ],
      },
      tracks: [],
    });

    (fixture.nativeElement as HTMLElement)
      .querySelector('button:not(.secondary)')
      ?.dispatchEvent(new Event('click'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(completeOnboardingTransaction).toHaveBeenCalled();
    expect(fixture.componentInstance['errors'][0]?.message).toBe(
      'The linked vow progress track is missing.',
    );
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('The linked vow progress track is missing.');
    expect(element.textContent).toContain('Guard the ford');
    expect(element.querySelector('a[href="/welcome/first-vow"]')).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('exposes keyboard-accessible edit/back/finish controls and predictable focus targets', async () => {
    await create();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#onboarding-review-title')?.getAttribute('tabindex')).toBe('-1');
    expect(element.querySelector('a[href="/character"]')?.textContent).toContain('Edit character');
    expect(element.querySelector('a[href="/welcome/first-vow"]')?.textContent).toContain('Edit');
    expect(element.querySelector('button:not(.secondary)')?.textContent).toContain(
      'Complete setup',
    );
  });
});
