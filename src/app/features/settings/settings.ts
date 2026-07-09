import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: '../placeholder-page.css',
})
export class Settings {
  protected readonly content: PlaceholderPageContent = {
    title: 'Settings',
    description: 'Adjust local companion preferences after options are defined.',
    emptyState: 'Settings controls will be added as the app grows.',
  };
}
