import { Component, inject } from '@angular/core';

import { CampaignWorkspaceService } from '@app/domain/services/campaign-workspace.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly workspace = inject(CampaignWorkspaceService);
}
