import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-oracles',
  templateUrl: './oracles.html',
  styleUrl: '../placeholder-page.css',
})
export class Oracles {
  protected readonly content: PlaceholderPageContent = {
    title: 'Oracles',
    description: 'Prepare a home for approved random prompts and tables.',
    emptyState: 'Oracle content will appear after licensing review.',
  };
}
