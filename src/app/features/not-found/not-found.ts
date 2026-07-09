import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.html',
  styleUrl: '../placeholder-page.css',
})
export class NotFound {
  protected readonly content: PlaceholderPageContent = {
    title: 'Page not found',
    description: 'The requested page does not exist in this companion shell.',
    emptyState: 'Use the navigation links to return to a planned area.',
  };
}
