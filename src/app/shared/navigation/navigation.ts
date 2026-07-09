import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavigationItem {
  readonly label: string;
  readonly path: string;
  readonly exact: boolean;
}

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation {
  protected readonly items: readonly NavigationItem[] = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Character', path: '/character', exact: false },
    { label: 'Moves', path: '/moves', exact: false },
    { label: 'Trackers', path: '/trackers', exact: false },
    { label: 'Oracles', path: '/oracles', exact: false },
    { label: 'Vows', path: '/vows', exact: false },
    { label: 'Journal', path: '/journal', exact: false },
    { label: 'Settings', path: '/settings', exact: false },
    { label: 'About', path: '/about', exact: false },
  ];
}
