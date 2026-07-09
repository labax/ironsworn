import { Component } from '@angular/core';

import { PlaceholderPageContent } from '@app/features/placeholder-page';

@Component({
  selector: 'app-trackers',
  templateUrl: './trackers.html',
  styleUrl: '../placeholder-page.css',
})
export class Trackers {
  protected readonly content: PlaceholderPageContent = {
    title: 'Trackers',
    description: 'Monitor campaign progress tracks and clocks when those features are implemented.',
    emptyState: 'Tracker controls are not available yet.',
  };
}
