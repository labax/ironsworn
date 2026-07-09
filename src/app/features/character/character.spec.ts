import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterDraftService } from '@app/domain/character';

import { Character } from './character';

describe('Character', () => {
  let fixture: ComponentFixture<Character>;
  let component: Character;
  let service: CharacterDraftService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Character],
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

  it('saves a valid character handoff in memory', () => {
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

    expect(service.character()).toMatchObject({
      name: 'Kara',
      concept: 'Wandering scout',
      stats: { edge: 3, heart: 2, iron: 2, shadow: 1, wits: 1 },
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: { current: 2 },
    });
  });
});
