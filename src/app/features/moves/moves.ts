import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-moves',
  templateUrl: './moves.html',
  styleUrl: '../placeholder-page.css',
})
export class Moves {
  protected readonly content: PlaceholderPageContent = {
    title: 'Moves',
    description: 'Browse approved move references after content review is complete.',
    emptyState: 'Move lookup and rolling support will be added later.',
  };
}
