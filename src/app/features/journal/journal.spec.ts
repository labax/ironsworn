import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PROJECT_ORIGINAL_PROVENANCE } from '@app/domain/content';
import { RollHistoryService } from '@app/domain/rolls';
import { resolveActionRoll } from '@app/rules/action-rolls';

import { Journal } from './journal';

const setInput = (element: HTMLInputElement | HTMLTextAreaElement, value: string): void => {
  element.value = value;
  element.dispatchEvent(new Event('input'));
};

describe('Journal', () => {
  let fixture: ComponentFixture<Journal>;
  let rollHistory: RollHistoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Journal] }).compileComponents();
    rollHistory = TestBed.inject(RollHistoryService);
    rollHistory.clear();
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
    expect(compiled().querySelector('.journal-body-preview')?.textContent).toBe(
      'My interpretation only.',
    );

    setInput(compiled().querySelector<HTMLInputElement>('#journal-title')!, 'Dirty');
    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
