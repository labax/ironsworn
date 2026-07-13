import { Component, HostListener } from '@angular/core';

import { CharacterDraftService } from '@app/domain/character';
import { RollHistoryService } from '@app/domain/rolls';
import { ApplicationAutosaveService } from '@app/domain/services/application-autosave.service';
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
    private readonly autosave: ApplicationAutosaveService,
  ) {
    void this.autosave.loadSavedSnapshot().then((result) => {
      if (!result.success || !result.found) {
        void characterDraft.loadSavedCharacter();
        void workspace.loadSavedWorkspace();
        void rollHistory.loadSavedHistory();
      }
      this.autosave.markInitialized();
    });
  }

  @HostListener('window:beforeunload')
  protected flushAutosaveBeforeUnload(): void {
    void this.autosave.flush();
  }

  @HostListener('document:visibilitychange')
  protected flushAutosaveWhenHidden(): void {
    if (document.visibilityState === 'hidden') void this.autosave.flush();
  }
}
