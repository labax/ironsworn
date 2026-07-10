import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BROWSER_STORAGE, createSaveEnvelope, type BrowserStorageLike } from '@app/core/storage';
import { CharacterDraftService } from '@app/domain/character';
import {
  ACTIVE_CHARACTER_STORAGE_KEY,
  type PersistedActiveCharacter,
} from '@app/domain/character/active-character-persistence.service';

import { Character } from './character';

class MemoryStorage implements BrowserStorageLike {
  readonly values = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new DOMException('Test save failure', 'QuotaExceededError');
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('Character', () => {
  let fixture: ComponentFixture<Character>;
  let component: Character;
  let service: CharacterDraftService;
  let storage: MemoryStorage;

  const saveDefaultCharacter = () => {
    component['characterForm'].setValue({
      name: 'Kara',
      concept: 'Wandering scout',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
      health: 3,
      spirit: 2,
      supply: 1,
      momentum: 4,
    });
    component['saveCharacter']();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    storage = new MemoryStorage();

    await TestBed.configureTestingModule({
      imports: [Character],
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }],
    }).compileComponents();

    service = TestBed.inject(CharacterDraftService);
    service.clear();
    fixture = TestBed.createComponent(Character);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the character creation form with first-use guidance', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('No character saved yet.');
    expect(compiled.querySelector('label[for="character-name"]')?.textContent).toContain('Name');
  });

  it('uses sensible status defaults', () => {
    expect(component['characterForm'].getRawValue()).toMatchObject({
      health: 5,
      spirit: 5,
      supply: 5,
      momentum: 2,
    });
  });

  it('shows validation feedback for a missing name and does not save', () => {
    component['saveCharacter']();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter a character name.');
    expect(service.character()).toBeNull();
  });

  it('saves a valid character handoff in active character state and displays its summary', () => {
    component['characterForm'].setValue({
      name: 'Kara',
      concept: 'Wandering scout',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
      health: 5,
      spirit: 5,
      supply: 5,
      momentum: 2,
    });

    component['saveCharacter']();

    fixture.detectChanges();

    expect(service.character()).toMatchObject({
      name: 'Kara',
      concept: 'Wandering scout',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: { current: 2 },
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Kara is ready.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Edge');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Momentum');
  });

  it('loads a valid persisted character and displays its summary', async () => {
    service.clear();
    storage.setItem(
      ACTIVE_CHARACTER_STORAGE_KEY,
      JSON.stringify(
        createSaveEnvelope<PersistedActiveCharacter>(
          {
            name: 'Vale',
            concept: 'Storm watcher',
            stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
            statusTracks: { health: 4, spirit: 3, supply: 2 },
            momentum: 4,
          },
          { appVersion: 'test' },
        ),
      ),
    );

    fixture = TestBed.createComponent(Character);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await service.loadSavedCharacter();
    fixture.detectChanges();

    expect(service.character()).toMatchObject({
      name: 'Vale',
      stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
      statusTracks: { health: 4, spirit: 3, supply: 2 },
      momentum: { current: 4 },
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Vale is ready.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('4');
  });

  it('opens the identity and stats editor with current active character values', () => {
    component['characterForm'].setValue({
      name: 'Kara',
      concept: 'Wandering scout',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
      health: 5,
      spirit: 5,
      supply: 5,
      momentum: 2,
    });
    component['saveCharacter']();
    fixture.detectChanges();

    component['openIdentityStatsEditor']();
    fixture.detectChanges();

    expect(component['identityStatsForm'].getRawValue()).toEqual({
      name: 'Kara',
      concept: 'Wandering scout',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Edit identity and stats');
  });

  it('saves valid identity and nonstandard stat edits without replacing unrelated fields', async () => {
    component['characterForm'].setValue({
      name: 'Kara',
      concept: 'Wandering scout',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
      health: 4,
      spirit: 3,
      supply: 2,
      momentum: 5,
    });
    component['saveCharacter']();
    const originalId = service.character()?.id;

    component['openIdentityStatsEditor']();
    component['identityStatsForm'].setValue({
      name: ' Vale ',
      concept: ' Storm watcher ',
      edge: 4,
      heart: 0,
      iron: 5,
      shadow: 2,
      wits: 3,
    });
    component['saveIdentityStats']();
    await Promise.resolve();
    fixture.detectChanges();

    expect(service.character()).toMatchObject({
      id: originalId,
      name: 'Vale',
      concept: 'Storm watcher',
      stats: { edge: 4, heart: 0, iron: 5, shadow: 2, wits: 3 },
      statusTracks: { health: 4, spirit: 3, supply: 2 },
      momentum: { current: 5 },
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Vale');
    expect(component['editingIdentityStats']).toBe(false);

    const saved = JSON.parse(storage.getItem(ACTIVE_CHARACTER_STORAGE_KEY) ?? '{}') as {
      payload: PersistedActiveCharacter;
    };
    expect(saved.payload).toMatchObject({
      name: 'Vale',
      concept: 'Storm watcher',
      stats: { edge: 4, heart: 0, iron: 5, shadow: 2, wits: 3 },
      statusTracks: { health: 4, spirit: 3, supply: 2 },
      momentum: 5,
    });
  });

  it('shows edit validation for required names and invalid numbers', () => {
    component['characterForm'].setValue({
      name: 'Kara',
      concept: '',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
      health: 5,
      spirit: 5,
      supply: 5,
      momentum: 2,
    });
    component['saveCharacter']();

    component['openIdentityStatsEditor']();
    component['identityStatsForm'].patchValue({ name: '   ', edge: 1.5 });
    component['saveIdentityStats']();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter a character name.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Use a whole number from 0 to 5.',
    );
    expect(service.character()?.name).toBe('Kara');
  });

  it('warns for nonstandard stat spreads but allows saving them', () => {
    component['characterForm'].setValue({
      name: 'Kara',
      concept: '',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
      health: 5,
      spirit: 5,
      supply: 5,
      momentum: 2,
    });
    component['saveCharacter']();
    component['openIdentityStatsEditor']();
    component['identityStatsForm'].patchValue({ edge: 5, heart: 4, iron: 3, shadow: 2, wits: 1 });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'These stats differ from 3, 2, 2, 1, 1.',
    );

    component['saveIdentityStats']();
    expect(service.character()?.stats).toEqual({ edge: 5, heart: 4, iron: 3, shadow: 2, wits: 1 });
  });

  it('renders prominent in-session Health, Spirit, and Supply controls', () => {
    saveDefaultCharacter();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('In-session status');
    expect(compiled.querySelector('#health-status-input')?.getAttribute('aria-label')).toBe(
      'Health value',
    );
    expect(compiled.querySelector('button[aria-label="Decrease Spirit"]')).toBeTruthy();
    expect(compiled.querySelector('button[aria-label="Increase Supply"]')).toBeTruthy();
  });

  it('increments and decrements each status track without changing unrelated fields', async () => {
    saveDefaultCharacter();
    const original = service.character();

    component['adjustStatusTrack']('health', 1);
    component['adjustStatusTrack']('spirit', -1);
    component['adjustStatusTrack']('supply', 1);
    await Promise.resolve();
    fixture.detectChanges();

    expect(service.character()).toMatchObject({
      id: original?.id,
      name: 'Kara',
      concept: 'Wandering scout',
      stats: original?.stats,
      momentum: { current: 4 },
      statusTracks: { health: 4, spirit: 1, supply: 2 },
    });

    const saved = JSON.parse(storage.getItem(ACTIVE_CHARACTER_STORAGE_KEY) ?? '{}') as {
      payload: PersistedActiveCharacter;
    };
    expect(saved.payload.statusTracks).toEqual({ health: 4, spirit: 1, supply: 2 });
    expect(saved.payload.name).toBe('Kara');
  });

  it('does not let normal increment or decrement controls move outside 0 to 5', () => {
    saveDefaultCharacter();
    component['commitStatusTrackInput']('health', { target: { value: '5' } } as unknown as Event);
    component['commitStatusTrackInput']('spirit', { target: { value: '0' } } as unknown as Event);

    component['adjustStatusTrack']('health', 1);
    component['adjustStatusTrack']('spirit', -1);

    expect(service.character()?.statusTracks).toMatchObject({ health: 5, spirit: 0, supply: 1 });
    expect(component['statusTrackMessages'].health).toContain('manual override');
    expect(component['statusTrackMessages'].spirit).toContain('manual override');
  });

  it('directly edits a selected status track and rejects invalid values without changing state', () => {
    saveDefaultCharacter();

    component['commitStatusTrackInput']('supply', { target: { value: '4' } } as unknown as Event);
    component['commitStatusTrackInput']('supply', { target: { value: '-1' } } as unknown as Event);
    component['commitStatusTrackInput']('supply', { target: { value: '2.5' } } as unknown as Event);

    expect(service.character()?.statusTracks).toEqual({ health: 3, spirit: 2, supply: 4 });
    expect(component['statusTrackMessages'].supply).toBe('Enter a whole number.');
  });

  it('requires explicit manual override for values above 5 and preserves the override after reload', async () => {
    saveDefaultCharacter();
    const originalId = service.character()?.id;

    component['commitStatusTrackInput']('health', { target: { value: '6' } } as unknown as Event);
    expect(service.character()?.statusTracks.health).toBe(3);

    component['updateStatusTrackOverride']('health', {
      target: { checked: true },
    } as unknown as Event);
    component['commitStatusTrackInput']('health', { target: { value: '6' } } as unknown as Event);
    await Promise.resolve();

    service.clear();
    await service.loadSavedCharacter();

    expect(service.character()).toMatchObject({
      id: originalId,
      statusTracks: { health: 6, spirit: 2, supply: 1 },
    });
  });

  it('shows save failure feedback without losing the in-memory status value', async () => {
    saveDefaultCharacter();
    storage.failWrites = true;

    component['adjustStatusTrack']('health', 1);
    await Promise.resolve();
    fixture.detectChanges();

    expect(service.character()?.statusTracks.health).toBe(4);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Save failed:');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'The current in-memory value is still shown.',
    );
  });

  it('cancels identity and stat edits without changing the active character', () => {
    component['characterForm'].setValue({
      name: 'Kara',
      concept: 'Wandering scout',
      edge: 3,
      heart: 2,
      iron: 2,
      shadow: 1,
      wits: 1,
      health: 5,
      spirit: 5,
      supply: 5,
      momentum: 2,
    });
    component['saveCharacter']();

    component['openIdentityStatsEditor']();
    component['identityStatsForm'].patchValue({ name: 'Changed', edge: 5 });
    component['cancelIdentityStatsEditor']();

    expect(service.character()).toMatchObject({
      name: 'Kara',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
    });
    expect(component['editingIdentityStats']).toBe(false);
  });
});
