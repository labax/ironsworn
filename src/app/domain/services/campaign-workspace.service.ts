import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CampaignWorkspaceService {
  readonly workspaceName = signal('Local campaign workspace');
  readonly mode = signal('Ready for MVP features');
}
