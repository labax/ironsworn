import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@app/features/home/home').then((m) => m.Home),
    title: 'Home | Ironsworn Digital Companion',
  },
  {
    path: 'character',
    loadComponent: () => import('@app/features/character/character').then((m) => m.Character),
    title: 'Character | Ironsworn Digital Companion',
  },
  {
    path: 'moves',
    loadComponent: () => import('@app/features/moves/moves').then((m) => m.Moves),
    title: 'Moves | Ironsworn Digital Companion',
  },
  {
    path: 'trackers',
    loadComponent: () => import('@app/features/trackers/trackers').then((m) => m.Trackers),
    title: 'Trackers | Ironsworn Digital Companion',
  },
  {
    path: 'oracles',
    loadComponent: () => import('@app/features/oracles/oracles').then((m) => m.Oracles),
    title: 'Oracles | Ironsworn Digital Companion',
  },
  {
    path: 'vows',
    loadComponent: () => import('@app/features/vows/vows').then((m) => m.Vows),
    title: 'Vows | Ironsworn Digital Companion',
  },
  {
    path: 'journal',
    loadComponent: () => import('@app/features/journal/journal').then((m) => m.Journal),
    title: 'Journal | Ironsworn Digital Companion',
  },
  {
    path: 'settings',
    loadComponent: () => import('@app/features/settings/settings').then((m) => m.Settings),
    title: 'Settings | Ironsworn Digital Companion',
  },
  {
    path: 'about',
    loadComponent: () => import('@app/features/about/about').then((m) => m.About),
    title: 'About | Ironsworn Digital Companion',
  },
  {
    path: '**',
    loadComponent: () => import('@app/features/not-found/not-found').then((m) => m.NotFound),
    title: 'Page not found | Ironsworn Digital Companion',
  },
];
