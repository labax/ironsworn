import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { ONBOARDING_WELCOME_COPY, OnboardingStateService } from '@app/domain/onboarding';
import { OnboardingWelcome } from './onboarding-welcome';

describe('OnboardingWelcome', () => {
  let fixture: ComponentFixture<OnboardingWelcome>;
  let completeWelcome: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    completeWelcome = vi.fn().mockResolvedValue({ success: true });
    navigate = vi.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [OnboardingWelcome],
      providers: [
        provideRouter([]),
        { provide: OnboardingStateService, useValue: { completeWelcome } },
      ],
    }).compileComponents();

    TestBed.inject(Router).navigate = navigate as unknown as Router['navigate'];
    fixture = TestBed.createComponent(OnboardingWelcome);
    fixture.detectChanges();
  });

  it('renders original disclaimer, scope, local-data, and concise setup copy', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(ONBOARDING_WELCOME_COPY.scope);
    expect(text).toContain(ONBOARDING_WELCOME_COPY.disclaimer);
    expect(text).toContain(ONBOARDING_WELCOME_COPY.localData);
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(3);
  });

  it('offers accessible start and skip controls with responsive action classes', () => {
    const start = fixture.debugElement.query(By.css('button.primary-action'));
    const skip = fixture.debugElement.query(By.css('a.secondary-action'));

    expect(start.nativeElement.textContent.trim()).toBe('Start setup');
    expect(skip.nativeElement.textContent.trim()).toBe('Skip for now');
    expect(skip.nativeElement.getAttribute('href')).toBe('/moves');
    expect(fixture.nativeElement.querySelector('.welcome-actions')).toBeTruthy();
  });

  it('marks welcome complete and navigates to character setup when start is activated', async () => {
    fixture.debugElement.query(By.css('button.primary-action')).nativeElement.click();
    await fixture.whenStable();

    expect(completeWelcome).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/character']);
  });

  it('does not mark onboarding complete when skip is available', () => {
    const skip = fixture.debugElement.query(By.css('a.secondary-action'));
    skip.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(completeWelcome).not.toHaveBeenCalled();
  });
});
