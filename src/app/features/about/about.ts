import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: '../placeholder-page.css',
})
export class About {
  protected readonly content: PlaceholderPageContent = {
    title: 'About',
    description: 'Review project status and placeholder notices for this unofficial companion.',
    emptyState: 'Licensing and attribution notices will be finalized before public release.',
  };
}
