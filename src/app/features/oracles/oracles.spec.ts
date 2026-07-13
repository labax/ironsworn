import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PROJECT_ORIGINAL_PROVENANCE } from '@domain/content';
import { RollHistoryService } from '@domain/rolls';
import { JournalHandoffService } from '../journal/journal-handoff.service';
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
  let rollHistory: RollHistoryService;
  let handoffs: JournalHandoffService;
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
    rollHistory = TestBed.inject(RollHistoryService);
    handoffs = TestBed.inject(JournalHandoffService);
    rollHistory.clear();
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

  it('rolls with empty context and preserves selected table', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    expect(compiled().querySelector('#selected-oracle-title')?.textContent).toContain(
      'First Table',
    );
    expect(compiled().querySelector('.oracle-roll-result')?.textContent).toContain(
      'Bundled result',
    );
    expect(compiled().querySelector('.oracle-roll-result')?.textContent).not.toContain(
      'Question or context',
    );
  });

  it('trims accidental edge whitespace and shows single-line context separately from result text', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    const context = compiled().querySelector<HTMLTextAreaElement>('#oracle-question-context')!;
    context.value = '  Is the camp hidden?  ';
    context.dispatchEvent(new Event('input'));
    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    expect(context.value).toBe('Is the camp hidden?');
    expect(compiled().querySelector('.oracle-result-context')?.textContent).toBe(
      'Is the camp hidden?',
    );
    expect(compiled().querySelector('.oracle-roll-result')?.textContent).toContain(
      'Original fixture result',
    );
  });

  it('preserves multiline context line breaks in the result handoff', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    const context = compiled().querySelector<HTMLTextAreaElement>('#oracle-question-context')!;
    context.value = 'Track the lights.\nKeep watch at dawn.';
    context.dispatchEvent(new Event('input'));
    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    expect(compiled().querySelector('.oracle-result-context')?.textContent).toBe(
      'Track the lights.\nKeep watch at dawn.',
    );
  });

  it('preserves context across resolver errors', async () => {
    const broken = { ...table('oracle:broken', 'Broken Table'), entries: [] };
    service.snapshot = { tables: [broken], groups: groupOracleTablesByCategory([broken]) };
    await createComponent();

    const context = compiled().querySelector<HTMLTextAreaElement>('#oracle-question-context')!;
    context.value = ' Check the sealed door. ';
    context.dispatchEvent(new Event('input'));
    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    expect(compiled().textContent).toContain('Oracle table must contain at least one entry.');
    expect(context.value).toBe('Check the sealed door.');
    expect(compiled().querySelector('.oracle-roll-result')).toBeNull();
    expect(rollHistory.entries()).toHaveLength(0);
  });

  it('clears only current context without changing selected table or prior result', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    const context = compiled().querySelector<HTMLTextAreaElement>('#oracle-question-context')!;
    context.value = 'Is the cache nearby?';
    context.dispatchEvent(new Event('input'));
    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();
    const priorResult = compiled().querySelector('.oracle-roll-result')?.textContent;

    compiled().querySelectorAll<HTMLButtonElement>('.oracle-detail .button-row button')[1]?.click();
    fixture.detectChanges();

    expect(compiled().querySelector('#selected-oracle-title')?.textContent).toContain(
      'First Table',
    );
    expect(compiled().querySelector<HTMLTextAreaElement>('#oracle-question-context')?.value).toBe(
      '',
    );
    expect(compiled().querySelector('.oracle-roll-result')?.textContent).toBe(priorResult);
  });

  it('associates the context textarea with visible label and help text', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    const label = compiled().querySelector('label[for="oracle-question-context"]');
    const textarea = compiled().querySelector<HTMLTextAreaElement>('#oracle-question-context');

    expect(label?.textContent).toContain('Question or context');
    expect(textarea?.getAttribute('aria-describedby')).toContain('oracle-question-context-help');
    expect(compiled().querySelector('#oracle-question-context-help')?.textContent).toContain(
      'Optional user-authored notes',
    );
  });

  it('displays a structured successful roll snapshot with table, value, entry, timestamp, and safe provenance label', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    const result = compiled().querySelector('.oracle-roll-result')!;
    expect(result.textContent).toContain('First Table');
    expect(result.textContent).toContain('Roll');
    expect(result.textContent).toContain('Original fixture result');
    expect(result.textContent).toContain('Project original');
    expect(result.querySelector('time')?.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.textContent).not.toContain('sourceId');
    expect(result.textContent).not.toContain('licenseUrl');
  });

  it('announces newly generated results accessibly', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    const announcement = compiled().querySelector('[role="status"][aria-live="polite"]');
    expect(announcement?.textContent).toContain('Oracle result saved to history: First Table');
    expect(announcement?.textContent).toContain('rolled');
  });

  it('re-rolling prepends a distinct immutable snapshot without mutating the previous result object', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      rollResults: () => readonly Readonly<unknown>[];
    };
    const previous = component.rollResults()[0];

    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    const snapshots = component.rollResults();
    expect(snapshots).toHaveLength(2);
    expect(snapshots[1]).toBe(previous);
    expect(snapshots[0]).not.toBe(previous);
    expect(Object.isFrozen(snapshots[1])).toBe(true);
    expect(compiled().querySelectorAll('.oracle-roll-result')).toHaveLength(2);
  });

  it('keeps bundled result text and user context in separately labelled structures for long mobile-readable content', async () => {
    const longEntry = {
      ...table('oracle:long', 'Long Entry Table'),
      entries: [
        {
          id: 'long-entry',
          range: { min: 1, max: 6 },
          text: 'Project-original long fixture result with enough words to wrap across narrow layouts while remaining readable at a glance.',
        },
      ],
    };
    service.snapshot = { tables: [longEntry], groups: groupOracleTablesByCategory([longEntry]) };
    await createComponent();

    const context = compiled().querySelector<HTMLTextAreaElement>('#oracle-question-context')!;
    context.value = 'Does the lookout notice the hidden path?';
    context.dispatchEvent(new Event('input'));
    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    expect(compiled().querySelector('.oracle-result-entry')?.textContent).toContain(
      'Bundled result',
    );
    expect(compiled().querySelector('.oracle-result-entry')?.textContent).toContain(
      'Project-original long fixture result',
    );
    expect(compiled().querySelector('.oracle-result-context-block')?.textContent).toContain(
      'User-authored question or context',
    );
    expect(compiled().querySelector('.oracle-result-context')?.textContent).toBe(
      'Does the lookout notice the hidden path?',
    );
  });

  it('saves oracle rolls into shared history and offers journal handoff', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();

    expect(compiled().querySelector('.oracle-result-actions')?.textContent).toContain(
      'Saved to shared roll history',
    );
    const actions = [
      ...compiled().querySelectorAll<HTMLButtonElement>('.oracle-result-actions button'),
    ];
    expect(actions.map((button) => button.textContent?.trim())).toEqual(['Send to Journal']);
    expect(actions.every((button) => button.disabled)).toBe(false);
    expect(rollHistory.entries()).toHaveLength(1);
    expect(rollHistory.entries()[0]).toMatchObject({
      type: 'oracle',
      oracleRoll: { tableName: 'First Table', resultText: 'Original fixture result' },
    });
  });

  it('starts a typed journal handoff from the latest result without mutating history', async () => {
    const first = table('oracle:first', 'First Table');
    service.snapshot = { tables: [first], groups: groupOracleTablesByCategory([first]) };
    await createComponent();

    compiled().querySelector<HTMLButtonElement>('.oracle-detail .button-row button')?.click();
    fixture.detectChanges();
    const before = rollHistory.entries()[0];

    compiled().querySelector<HTMLButtonElement>('.oracle-result-actions button')?.click();
    fixture.detectChanges();

    const pending = handoffs.consume();
    expect(pending?.source).toMatchObject({
      id: before.id,
      type: 'oracle',
      oracleRoll: {
        tableName: 'First Table',
        roll: before.oracleRoll?.roll,
        resultText: 'Original fixture result',
        provenance: { manifestId: 'oracle:first-manifest' },
      },
    });
    expect(pending?.returnUrl).toBe('/oracles');
    expect(rollHistory.entries()[0]).toEqual(before);
  });
});
