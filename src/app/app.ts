import { Component } from '@angular/core';

import { CharacterDraftService } from '@app/domain/character';
import { RollHistoryService } from '@app/domain/rolls';
import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';
import { AppShell } from '@app/shell/app-shell';

@Component({
  selector: 'app-root',
  imports: [AppShell],
  template: '<app-shell />',
})
export class App {
  constructor(
    characterDraft: CharacterDraftService,
    workspace: CampaignWorkspaceService,
    rollHistory: RollHistoryService,
  ) {
    void characterDraft.loadSavedCharacter();
    void workspace.loadSavedWorkspace();
    void rollHistory.loadSavedHistory();
  }
}
