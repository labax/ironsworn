import { Component } from '@angular/core';

import { CharacterDraftService } from '@app/domain/character';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { AppShell } from '@app/shell/app-shell';

@Component({
  selector: 'app-root',
  imports: [AppShell],
  template: '<app-shell />',
})
export class App {
  constructor(characterDraft: CharacterDraftService, workspace: CampaignWorkspaceService) {
    void characterDraft.loadSavedCharacter();
    void workspace.loadSavedWorkspace();
  }
}
