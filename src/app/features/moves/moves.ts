import { Component } from '@angular/core';

import { ActionRollInput } from './action-roll-input';
import { RollHistoryList } from './roll-history-list';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-moves',
  imports: [ActionRollInput, RollHistoryList],
  templateUrl: './moves.html',
  styleUrl: '../placeholder-page.css',
})
export class Moves {
  protected readonly content: PlaceholderPageContent = {
    title: 'Moves',
    description: 'Prepare compact roll inputs for the first play slice.',
    emptyState: 'Move lookup can connect here after content review is complete.',
  };
}
