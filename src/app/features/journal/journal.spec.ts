import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PROJECT_ORIGINAL_PROVENANCE } from '@app/domain/content';
import { RollHistoryService } from '@app/domain/rolls';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { resolveActionRoll } from '@app/rules/action-rolls';

import { Journal } from './journal';
import { JournalHandoffService } from './journal-handoff.service';

const setInput = (element: HTMLInputElement | HTMLTextAreaElement, value: string): void => {
  element.value = value;
  element.dispatchEvent(new Event('input'));
};

describe('Journal', () => {
  let fixture: ComponentFixture<Journal>;
  let rollHistory: RollHistoryService;
  let workspace: CampaignWorkspaceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Journal] }).compileComponents();
    rollHistory = TestBed.inject(RollHistoryService);
    workspace = TestBed.inject(CampaignWorkspaceService);
    rollHistory.clear();
    workspace.clearJournalEntries();
    fixture = TestBed.createComponent(Journal);
    fixture.detectChanges();
  });

  const compiled = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('creates an entry, safely renders long plain text, edits it, and preserves focus labels', async () => {
    const title = compiled().querySelector<HTMLInputElement>('#journal-title')!;
    const body = compiled().querySelector<HTMLTextAreaElement>('#journal-body')!;
    const unsafeLongText = '<img src=x onerror=alert(1)> user-authored line\n'.repeat(80);

    setInput(title, 'First watch');
    setInput(body, unsafeLongText);
    compiled().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(compiled().textContent).toContain('First watch');
    expect(compiled().querySelector('img')).toBeNull();
    expect(compiled().querySelector('.journal-body-preview')?.textContent).toContain(
      '<img src=x onerror=alert(1)>',
    );
    expect(title.getAttribute('aria-describedby')).toBe('journal-title-help journal-title-error');
    expect(body.getAttribute('aria-describedby')).toBe('journal-body-help');

    compiled().querySelector<HTMLButtonElement>('.journal-card button')!.click();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    expect(document.activeElement).toBe(compiled().querySelector('#journal-title'));

    setInput(compiled().querySelector<HTMLInputElement>('#journal-title')!, 'Edited watch');
    compiled().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    expect(compiled().textContent).toContain('Edited watch');
    expect(compiled().textContent).not.toContain('No journal entries yet');
  });

  it('preserves text on validation errors and cancels dirty drafts without committing', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    setInput(compiled().querySelector<HTMLTextAreaElement>('#journal-body')!, 'Draft survives.');
    compiled().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(compiled().textContent).toContain('Enter a journal title.');
    expect(compiled().querySelector<HTMLTextAreaElement>('#journal-body')?.value).toBe(
      'Draft survives.',
    );

    compiled().querySelector<HTMLButtonElement>('button.secondary')!.click();
    fixture.detectChanges();
    expect(confirmSpy).toHaveBeenCalledWith('Discard unsaved journal changes?');
    expect(compiled().textContent).toContain('No journal entries yet');
    confirmSpy.mockRestore();
  });

  it('accepts oracle handoffs as separate generated snapshots', () => {
    rollHistory.saveOracleRoll({
      result: {
        id: 'oracle-result-1',
        tableId: 'oracle:weather',
        tableName: 'Project weather',
        tableKind: 'table',
        roll: 42,
        rollRange: { min: 1, max: 100 },
        entryId: 'oracle-entry-1',
        entryRange: { min: 41, max: 50 },
        text: 'Project-original result',
        provenance: PROJECT_ORIGINAL_PROVENANCE,
        tableProvenance: PROJECT_ORIGINAL_PROVENANCE,
        timestamp: '2026-07-13T01:00:00.000Z',
        sourceType: 'project_original',
        questionContext: 'User-authored question?',
      },
    });
    fixture.detectChanges();

    setInput(compiled().querySelector<HTMLInputElement>('#journal-title')!, 'Oracle note');
    setInput(compiled().querySelector<HTMLTextAreaElement>('#journal-body')!, 'My answer.');
    const select = compiled().querySelector<HTMLSelectElement>('#journal-handoff')!;
    select.value = 'roll-history-1';
    select.dispatchEvent(new Event('change'));
    compiled().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(compiled().textContent).toContain('Oracle snapshot: Project weather');
    expect(compiled().querySelector('.journal-body-preview')?.textContent).toBe('My answer.');
  });

  it('consumes an oracle handoff as a reviewable draft, saves once, and leaves the source snapshot stable', async () => {
    const saved = rollHistory.saveOracleRoll({
      result: {
        id: 'oracle-result-1',
        tableId: 'oracle:weather',
        tableName: 'Project weather',
        tableKind: 'table',
        roll: 42,
        rollRange: { min: 1, max: 100 },
        entryId: 'oracle-entry-1',
        entryRange: { min: 41, max: 50 },
        text: 'Project-original result',
        provenance: PROJECT_ORIGINAL_PROVENANCE,
        tableProvenance: PROJECT_ORIGINAL_PROVENANCE,
        timestamp: '2026-07-13T01:00:00.000Z',
        sourceType: 'project_original',
        questionContext: 'User-authored question?',
      },
      note: 'User-authored note.',
    });
    const handoffs = TestBed.inject(JournalHandoffService);
    handoffs.start(saved, '/oracles');

    fixture = TestBed.createComponent(Journal);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(compiled().querySelector<HTMLInputElement>('#journal-title')?.value).toContain(
      'Oracle: Project weather',
    );
    expect(compiled().textContent).toContain('Attached generated snapshot');
    setInput(
      compiled().querySelector<HTMLTextAreaElement>('#journal-body')!,
      'User-authored follow-up.',
    );
    const sourceBefore = rollHistory.entries()[0];

    compiled().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    compiled().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(workspace.journalEntries()).toHaveLength(1);
    expect(workspace.journalEntries()[0]).toMatchObject({
      type: 'oracle_result',
      body: 'User-authored follow-up.',
      sourceReferences: [{ id: saved.id, type: 'oracle', label: 'Oracle: Project weather' }],
      snapshots: [
        {
          type: 'oracle',
          roll: { id: saved.id, oracleRoll: { roll: 42, tableName: 'Project weather' } },
        },
      ],
    });
    expect(rollHistory.entries()[0]).toEqual(sourceBefore);
  });

  it('warns before discarding dirty changes and stores roll handoff snapshots separately', () => {
    const result = resolveActionRoll({ stat: 2, adds: 1, actionDie: 4, challengeDice: [3, 9] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    rollHistory.saveActionRoll({
      prepared: {
        label: 'Cross the pass',
        statKey: 'edge',
        statValue: 2,
        adds: 1,
        source: 'manual',
      },
      result: result.value,
      createdAt: '2026-07-13T00:00:00.000Z',
    });
    fixture.detectChanges();

    setInput(compiled().querySelector<HTMLInputElement>('#journal-title')!, 'Roll note');
    setInput(
      compiled().querySelector<HTMLTextAreaElement>('#journal-body')!,
      'My interpretation only.',
    );
    const select = compiled().querySelector<HTMLSelectElement>('#journal-handoff')!;
    select.value = 'roll-history-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    compiled().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(compiled().textContent).toContain('Source references');
    expect(compiled().textContent).toContain('Generated snapshots');
    expect(compiled().textContent).toContain(
      'These generated mechanical results are preserved separately from your journal text.',
    );
    expect(compiled().textContent).toContain('User-authored journal text');
    expect(compiled().querySelector('[aria-label="Generated mechanical snapshot"]')).toBeTruthy();
    expect(compiled().querySelector('.journal-body-preview')?.textContent).toBe(
      'My interpretation only.',
    );

    setInput(compiled().querySelector<HTMLInputElement>('#journal-title')!, 'Dirty');
    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('orders entries newest first with stable tie ordering and opens the selected stable record', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-07-13T10:00:00.000Z'));
      const beta = workspace.saveJournalEntry({
        id: 'journal-beta',
        title: 'Beta title',
        body: '',
      });
      const alpha = workspace.saveJournalEntry({
        id: 'journal-alpha',
        title: 'Alpha title',
        body: 'Older',
      });
      vi.setSystemTime(new Date('2026-07-13T11:00:00.000Z'));
      workspace.saveJournalEntry({
        id: 'journal-newest',
        title: 'Newest title',
        body: 'Latest body',
      });
      expect(beta.ok && alpha.ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
    fixture.detectChanges();

    const cards = [...compiled().querySelectorAll('.journal-card h4')].map((node) =>
      node.textContent?.trim(),
    );
    expect(cards).toEqual(['Newest title', 'Alpha title', 'Beta title']);

    compiled().querySelectorAll<HTMLButtonElement>('.journal-card .secondary')[2].click();
    fixture.detectChanges();
    expect(compiled().querySelector('.reading-view h3')?.textContent).toContain('Beta title');
    expect(compiled().textContent).toContain('No body text.');
  });

  it('keeps historical generated snapshots readable when the live source link is broken', () => {
    const result = resolveActionRoll({ stat: 1, actionDie: 5, challengeDice: [2, 8] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const saved = rollHistory.saveActionRoll({
      prepared: {
        label: 'Temporary roll',
        statKey: 'edge',
        statValue: 1,
        adds: 0,
        source: 'manual',
      },
      result: result.value,
      createdAt: '2026-07-13T02:00:00.000Z',
    });
    const roll = saved;
    workspace.saveJournalEntry({
      id: 'journal-broken-source',
      title: 'Broken source note',
      body: '',
      sourceReferences: [{ id: roll.id, type: 'roll', label: 'Roll: Temporary roll' }],
      snapshots: [{ type: 'roll', roll }],
    });
    rollHistory.clear();
    fixture.detectChanges();

    expect(compiled().textContent).toContain(
      'Roll: Temporary roll is unavailable; snapshot preserved.',
    );
    expect(compiled().textContent).toContain('Roll snapshot: Temporary roll');
    expect(compiled().textContent).toContain('No body text.');
  });
  it('requires confirmation, cancels without state changes, and returns focus to the delete trigger', async () => {
    workspace.saveJournalEntry({
      id: 'journal-delete-a',
      title: 'Delete candidate',
      body: 'Keep until confirmed.',
    });
    workspace.saveJournalEntry({
      id: 'journal-delete-b',
      title: 'Other entry',
      body: 'Unrelated.',
    });
    fixture.detectChanges();
    const before = workspace.journalEntries();
    const readTarget = Array.from(
      compiled().querySelectorAll<HTMLButtonElement>('.card-actions .secondary'),
    ).find((button) => button.textContent?.includes('Delete candidate'))!;
    readTarget.click();
    fixture.detectChanges();
    const trigger = compiled().querySelector<HTMLButtonElement>('.reading-actions .secondary')!;

    trigger.click();
    fixture.detectChanges();
    expect(compiled().querySelector('[role="dialog"]')?.textContent).toContain('Delete candidate');
    expect(compiled().querySelector('[role="dialog"]')?.textContent).toContain(
      'Linked rolls, oracles, vows, and other records are kept.',
    );

    compiled().querySelector<HTMLButtonElement>('.delete-actions .secondary')!.click();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(workspace.journalEntries()).toEqual(before);
    expect(compiled().querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('confirms deletion of only the selected entry while preserving order, unrelated entries, and linked records', async () => {
    const result = resolveActionRoll({ stat: 2, adds: 1, actionDie: 4, challengeDice: [3, 9] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const savedRoll = rollHistory.saveActionRoll({
      prepared: { label: 'Linked roll', statKey: 'edge', statValue: 2, adds: 1, source: 'manual' },
      result: result.value,
      createdAt: '2026-07-13T00:00:00.000Z',
    });
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-07-13T09:00:00.000Z'));
      workspace.saveJournalEntry({ id: 'journal-older', title: 'Older', body: '' });
      vi.setSystemTime(new Date('2026-07-13T10:00:00.000Z'));
      workspace.saveJournalEntry({
        id: 'journal-linked',
        title: 'Linked entry',
        body: 'Delete this note only.',
        sourceReferences: [{ id: savedRoll.id, type: 'roll', label: 'Roll: Linked roll' }],
        snapshots: [{ type: 'roll', roll: savedRoll }],
      });
      vi.setSystemTime(new Date('2026-07-13T11:00:00.000Z'));
      workspace.saveJournalEntry({ id: 'journal-newer', title: 'Newer', body: '' });
    } finally {
      vi.useRealTimers();
    }
    fixture.detectChanges();
    workspace.selectJournalEntry('journal-linked');
    fixture.componentInstance['selectedEntryId'].set('journal-linked');
    fixture.detectChanges();

    compiled().querySelector<HTMLButtonElement>('.reading-actions .secondary')!.click();
    fixture.detectChanges();
    expect(compiled().querySelector('[role="dialog"]')?.textContent).toContain('source links');
    expect(compiled().querySelector('[role="dialog"]')?.textContent).toContain(
      'generated snapshots',
    );

    compiled().querySelector<HTMLButtonElement>('.delete-actions .danger')!.click();
    compiled().querySelector<HTMLButtonElement>('.delete-actions .danger')?.click();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(workspace.journalEntries().map((entry) => entry.id)).toEqual([
      'journal-newer',
      'journal-older',
    ]);
    expect(rollHistory.entries()).toEqual([savedRoll]);
    expect(compiled().textContent).toContain('Linked records were kept.');
  });

  it('dismisses the confirmation with Escape and handles stale deletion safely', async () => {
    workspace.saveJournalEntry({ id: 'journal-stale', title: 'Stale entry', body: '' });
    fixture.detectChanges();

    compiled().querySelector<HTMLButtonElement>('.reading-actions .secondary')!.click();
    fixture.detectChanges();
    compiled()
      .querySelector<HTMLElement>('.delete-dialog')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    expect(workspace.journalEntries().map((entry) => entry.id)).toEqual(['journal-stale']);
    expect(compiled().querySelector('[role="dialog"]')).toBeNull();

    compiled().querySelector<HTMLButtonElement>('.reading-actions .secondary')!.click();
    fixture.detectChanges();
    expect(workspace.deleteJournalEntry('journal-stale').ok).toBe(true);
    compiled().querySelector<HTMLButtonElement>('.delete-actions .danger')!.click();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(workspace.journalEntries()).toEqual([]);
    expect(compiled().textContent).toContain('Journal entry was not found.');
  });

  it('keeps delete dialog focus inside the dialog and labels the destructive action', async () => {
    workspace.saveJournalEntry({ id: 'journal-focus', title: 'Focus target', body: '' });
    fixture.detectChanges();

    compiled().querySelector<HTMLButtonElement>('.reading-actions .secondary')!.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    const dialog = compiled().querySelector<HTMLElement>('.delete-dialog')!;
    const cancel = compiled().querySelector<HTMLButtonElement>('.delete-actions .secondary')!;
    const danger = compiled().querySelector<HTMLButtonElement>('.delete-actions .danger')!;
    expect(document.activeElement).toBe(cancel);
    expect(danger.getAttribute('aria-label')).toBe(
      'Permanently delete journal entry: Focus target',
    );

    cancel.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(danger);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    expect(compiled().querySelector('[role="dialog"]')).toBeNull();
  });
});
