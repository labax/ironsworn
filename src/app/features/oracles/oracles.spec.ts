import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PROJECT_ORIGINAL_PROVENANCE } from '@domain/content';
import { groupOracleTablesByCategory, type BrowsableOracleTable } from '@domain/oracles';

import { OracleBrowserService, type OracleBrowserSnapshot } from './oracle-browser.service';
import { Oracles } from './oracles';

const table = (id: string, name: string, category = 'Common'): BrowsableOracleTable => ({
  id,
  name,
  category,
  description: `Project-original helper for ${name}.`,
  kind: 'table',
  rollRange: { min: 1, max: 6 },
  provenance: {
    ...PROJECT_ORIGINAL_PROVENANCE,
    manifestId: `${id}-manifest`,
    releaseStatus: 'allowed',
    reviewStatus: 'reviewed',
  },
  sourceType: 'project_original',
  entries: [{ id: `${id}:entry`, range: { min: 1, max: 6 }, text: 'Original fixture result' }],
});

class MockOracleBrowserService {
  snapshot: OracleBrowserSnapshot = { tables: [], groups: [] };
  error: Error | undefined;
  loadApprovedTables = vi.fn(async () => {
    if (this.error) throw this.error;
    return this.snapshot;
  });
  findApprovedTable = vi.fn((id: string) =>
    this.snapshot.tables.find((candidate) => candidate.id === id),
  );
}

describe('Oracles', () => {
  let fixture: ComponentFixture<Oracles>;
  let service: MockOracleBrowserService;
  const compiled = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const createComponent = async () => {
    fixture = TestBed.createComponent(Oracles);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    service = new MockOracleBrowserService();
    await TestBed.configureTestingModule({
      imports: [Oracles],
      providers: [{ provide: OracleBrowserService, useValue: service }],
    }).compileComponents();
  });

  it('renders loading and empty states safely', async () => {
    let resolve!: (value: OracleBrowserSnapshot) => void;
    service.loadApprovedTables = vi.fn(
      () => new Promise<OracleBrowserSnapshot>((done) => (resolve = done)),
    );
    fixture = TestBed.createComponent(Oracles);
    fixture.detectChanges();

    expect(compiled().textContent).toContain('Loading oracle tables');

    resolve({ tables: [], groups: [] });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled().textContent).toContain('No approved oracle tables yet.');
  });

  it('renders an understandable failed-load state without crashing', async () => {
    service.error = new Error('boom');
    await createComponent();

    expect(compiled().textContent).toContain('Oracle tables are unavailable.');
    expect(compiled().querySelector('button')?.textContent).toContain('Try again');
  });

  it('shows approved tables grouped by category with availability labels', async () => {
    service.snapshot = {
      tables: [
        table('oracle:scene', 'Scene Tone', 'Session prompts'),
        table('oracle:npc', 'NPC Need', 'Characters'),
      ],
      groups: groupOracleTablesByCategory([
        table('oracle:scene', 'Scene Tone', 'Session prompts'),
        table('oracle:npc', 'NPC Need', 'Characters'),
      ]),
    };
    await createComponent();

    expect(compiled().textContent).toContain('Characters');
    expect(compiled().textContent).toContain('Session prompts');
    expect(compiled().textContent).toContain('Reviewed for release');
  });

  it('filters by search category source combinations and reset', async () => {
    const scene = {
      ...table('oracle:scene', 'Scene Tone', 'Session prompts'),
      description: 'Mood cue.',
    };
    const npc = {
      ...table('oracle:npc', 'NPC Need', 'Characters'),
      description: 'Supporting character wants.',
    };
    service.snapshot = { tables: [scene, npc], groups: groupOracleTablesByCategory([scene, npc]) };
    await createComponent();

    const search = compiled().querySelector<HTMLInputElement>('#oracle-search')!;
    search.value = 'mood';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled().querySelector('.oracle-nav')?.textContent).toContain('Scene Tone');
    expect(compiled().querySelector('.oracle-nav')?.textContent).not.toContain('NPC Need');

    compiled().querySelector<HTMLButtonElement>('button[disabled]')?.click();
    compiled().querySelector<HTMLButtonElement>('.oracle-filter-actions button')?.click();
    fixture.detectChanges();
    expect(compiled().textContent).toContain('NPC Need');

    const category = compiled().querySelector<HTMLSelectElement>('#oracle-category-filter')!;
    category.value = 'Characters';
    category.dispatchEvent(new Event('change'));
    const source = compiled().querySelector<HTMLSelectElement>('#oracle-source-filter')!;
    source.value = 'project_original';
    source.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(compiled().querySelector('.oracle-nav')?.textContent).toContain('NPC Need');
    expect(compiled().querySelector('.oracle-nav')?.textContent).not.toContain('Scene Tone');
  });

  it('shows a recoverable no-results state', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    const search = compiled().querySelector<HTMLInputElement>('#oracle-search')!;
    search.value = 'no match';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled().textContent).toContain('No oracle tables match these filters.');
    compiled().querySelector<HTMLButtonElement>('.no-results button')?.click();
    fixture.detectChanges();

    expect(compiled().textContent).toContain('First Table');
    expect(compiled().querySelector<HTMLInputElement>('#oracle-search')?.value).toBe('');
  });

  it('preserves query state during in-page table navigation', async () => {
    const first = { ...table('oracle:first', 'First Table'), description: 'Shared prompt.' };
    const second = { ...table('oracle:second', 'Second Table'), description: 'Shared prompt.' };
    service.snapshot = {
      tables: [first, second],
      groups: groupOracleTablesByCategory([first, second]),
    };
    await createComponent();

    const search = compiled().querySelector<HTMLInputElement>('#oracle-search')!;
    search.value = 'shared';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    compiled()
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Open oracle table Second Table in Common"]',
      )
      ?.click();
    fixture.detectChanges();

    expect(compiled().querySelector<HTMLInputElement>('#oracle-search')?.value).toBe('shared');
    expect(compiled().querySelector('#selected-oracle-title')?.textContent).toContain(
      'Second Table',
    );
  });

  it('uses persistent labels and native accessible controls for discovery', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    expect(compiled().querySelector('label[for="oracle-search"]')?.textContent).toContain(
      'Search tables',
    );
    expect(compiled().querySelector('label[for="oracle-category-filter"]')?.textContent).toContain(
      'Category',
    );
    expect(compiled().querySelector('label[for="oracle-source-filter"]')?.textContent).toContain(
      'Source',
    );
    expect(compiled().querySelector('#oracle-filter-summary')?.textContent).toContain(
      'Showing 1 of 1',
    );
  });

  it('opens the selected table by stable ID', async () => {
    const first = table('oracle:first', 'First Table');
    const second = table('oracle:second', 'Second Table');
    service.snapshot = {
      tables: [first, second],
      groups: groupOracleTablesByCategory([first, second]),
    };
    await createComponent();

    compiled()
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Open oracle table Second Table in Common"]',
      )
      ?.click();
    fixture.detectChanges();

    expect(compiled().querySelector('#selected-oracle-title')?.textContent).toContain(
      'Second Table',
    );
    expect(compiled().textContent).toContain('oracle:second');
  });

  it('uses semantic keyboard-accessible button controls for table navigation', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    const button = compiled().querySelector<HTMLButtonElement>('.oracle-list-button');
    expect(button?.tagName).toBe('BUTTON');
    expect(button?.getAttribute('aria-label')).toBe('Open oracle table First Table in Common');
    expect(button?.getAttribute('aria-current')).toBe('true');
  });
});
