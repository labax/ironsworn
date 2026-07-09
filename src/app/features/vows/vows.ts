import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-vows',
  templateUrl: './vows.html',
  styleUrl: '../placeholder-page.css',
})
export class Vows {
  protected readonly content: PlaceholderPageContent = {
    title: 'Vows',
    description: 'Organize long-term promises and progress in a future feature area.',
    emptyState: 'Vow tracking is planned for a later issue.',
  };
}
