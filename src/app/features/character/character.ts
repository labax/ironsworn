import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-character',
  templateUrl: './character.html',
  styleUrl: '../placeholder-page.css',
})
export class Character {
  protected readonly content: PlaceholderPageContent = {
    title: 'Character',
    description: 'Keep character details in one place once the MVP record sheet is ready.',
    emptyState: 'Character tools are coming soon.',
  };
}
