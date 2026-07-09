import { Component } from '@angular/core';

import { CharacterDraftService } from '@app/domain/character';
import { AppShell } from '@app/shell/app-shell';

@Component({
  selector: 'app-root',
  imports: [AppShell],
  template: '<app-shell />',
})
export class App {
  constructor(characterDraft: CharacterDraftService) {
    void characterDraft.loadSavedCharacter();
  }
}
