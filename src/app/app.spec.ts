import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the application shell and navigation links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Ironsworn Companion');
    expect(compiled.querySelector('main')).toBeTruthy();

    const links = [...compiled.querySelectorAll('nav a')].map((link) => ({
      label: link.textContent?.trim(),
      href: link.getAttribute('href'),
    }));

    expect(links).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Character', href: '/character' },
      { label: 'Moves', href: '/moves' },
      { label: 'Trackers', href: '/trackers' },
      { label: 'Oracles', href: '/oracles' },
      { label: 'Vows', href: '/vows' },
      { label: 'Journal', href: '/journal' },
      { label: 'Settings', href: '/settings' },
      { label: 'About', href: '/about' },
    ]);
  });
});
