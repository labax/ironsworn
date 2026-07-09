import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-journal',
  templateUrl: './journal.html',
  styleUrl: '../placeholder-page.css',
})
export class Journal {
  protected readonly content: PlaceholderPageContent = {
    title: 'Journal',
    description: 'Capture session notes and campaign events when persistence work lands.',
    emptyState: 'Journal entries are coming soon.',
  };
}
