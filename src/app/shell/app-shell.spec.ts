import { signal } from '@angular/core';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppInfoService } from '@app/core/services/app-info.service';
import {
  ApplicationAutosaveService,
  type AutosaveStatus,
} from '@app/domain/services/application-autosave.service';

import { AppShell } from './app-shell';

class AppInfoStub {
  readonly appName = signal('Ironsworn Companion');
  readonly version = signal('0.1.0');
  readonly environmentName = signal('uat');
  readonly showUatBanner = signal(true);
  readonly storageMode = signal('local');
  readonly contentMode = signal('development');
}

class AutosaveStub {
  readonly saveStatus = signal<AutosaveStatus>('saved');
  readonly retry = vi.fn().mockResolvedValue({ success: true });
}

const setup = async (options: { showUatBanner?: boolean; saveStatus?: AutosaveStatus } = {}) => {
  const appInfo = new AppInfoStub();
  const autosave = new AutosaveStub();
  appInfo.showUatBanner.set(options.showUatBanner ?? true);
  autosave.saveStatus.set(options.saveStatus ?? 'saved');

  await TestBed.configureTestingModule({
    imports: [AppShell],
    providers: [
      provideRouter([]),
      { provide: AppInfoService, useValue: appInfo },
      { provide: ApplicationAutosaveService, useValue: autosave },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AppShell);
  fixture.detectChanges();
  return { fixture, appInfo, autosave };
};

const text = (fixture: ComponentFixture<AppShell>, selector: string): string | undefined =>
  fixture.nativeElement.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

describe('AppShell', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the UAT banner with save status inside the banner', async () => {
    const { fixture } = await setup({ showUatBanner: true, saveStatus: 'saved' });
    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('.uat-banner');

    expect(banner).toBeTruthy();
    expect(banner?.textContent).toContain('Environment: uat');
    expect(banner?.textContent).toContain('Storage: local');
    expect(banner?.textContent).toContain('Content: development');
    expect(banner?.querySelector('.save-status')?.textContent).toContain('Save: saved');
    expect(compiled.querySelector('.save-status--fallback')).toBeNull();
  });

  it('places live-region markup on the UAT save-status subgroup only', async () => {
    const { fixture } = await setup({ showUatBanner: true, saveStatus: 'saving' });
    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('.uat-banner');
    const status = banner?.querySelector('.save-status');

    expect(banner?.hasAttribute('aria-live')).toBe(false);
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.getAttribute('aria-label')).toBe('Save status');
    expect(status?.getAttribute('aria-atomic')).toBe('true');
  });

  it('renders retry inside the UAT banner when saving failed', async () => {
    const { fixture } = await setup({ showUatBanner: true, saveStatus: 'failed' });
    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('.uat-banner');
    const retry = banner?.querySelector('button');

    expect(text(fixture, '.uat-banner .save-status')).toContain('Save: failed');
    expect(retry?.textContent?.trim()).toBe('Retry save');
    expect(compiled.querySelector('.save-status--fallback')).toBeNull();
  });

  it('clicking retry invokes the autosave retry method once', async () => {
    const { fixture, autosave } = await setup({ showUatBanner: true, saveStatus: 'failed' });
    const button = fixture.nativeElement.querySelector(
      '.uat-banner .save-status button',
    ) as HTMLButtonElement | null;

    button?.click();
    fixture.detectChanges();

    expect(autosave.retry).toHaveBeenCalledTimes(1);
  });

  it('uses a non-UAT failed fallback without duplicate status output', async () => {
    const { fixture } = await setup({ showUatBanner: false, saveStatus: 'failed' });
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.uat-banner')).toBeNull();
    expect(compiled.querySelectorAll('.save-status').length).toBe(1);
    expect(text(fixture, '.save-status--fallback')).toContain('Save: failed');
    expect(compiled.querySelector('.save-status--fallback button')?.textContent?.trim()).toBe(
      'Retry save',
    );
  });

  it('does not render routine standalone save status when UAT is hidden', async () => {
    const { fixture } = await setup({ showUatBanner: false, saveStatus: 'saved' });
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.uat-banner')).toBeNull();
    expect(compiled.querySelector('.save-status')).toBeNull();
  });

  it('keeps header, navigation, main content, and footer rendering', async () => {
    const { fixture } = await setup({ showUatBanner: true, saveStatus: 'idle' });
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header h1')?.textContent).toContain('Ironsworn Companion');
    expect(compiled.querySelector('nav a')?.textContent).toContain('Home');
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
    expect(compiled.querySelector('footer')?.textContent).toContain('About and disclaimer');
  });
});
