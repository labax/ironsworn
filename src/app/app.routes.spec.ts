import { routes } from './app.routes';

describe('routes', () => {
  it('defines placeholder routes for each MVP shell area', () => {
    const configuredPaths = routes.map((route) => route.path);

    expect(configuredPaths).toEqual([
      '',
      'character',
      'moves',
      'trackers',
      'oracles',
      'vows',
      'journal',
      'settings',
      'about',
      '**',
    ]);
  });

  it('lazy-loads components for each visible route', () => {
    const visibleRoutes = routes.filter((route) => route.path !== '**');

    expect(visibleRoutes.every((route) => typeof route.loadComponent === 'function')).toBe(true);
  });
});
