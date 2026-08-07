import { describe, expect, it } from 'vitest';
import { APP_ROUTES, getPageTitle, getRouteByPathname } from '../frontend/src/uiRoutes';

describe('ui routes', () => {
  it('exposes the main navigation routes', () => {
    expect(APP_ROUTES.map((route: { path: string }) => route.path)).toEqual([
      '/dashboard',
      '/forecast',
      '/production',
      '/inventory',
      '/purchasing',
      '/products',
      '/recipes',
      '/configuration',
    ]);
  });

  it('normalizes the root path to the dashboard route', () => {
    expect(getRouteByPathname('/')).toMatchObject({ path: '/dashboard', title: 'Dashboard' });
  });

  it('returns a fallback title for unknown paths', () => {
    expect(getPageTitle('/unknown')).toBe('Dashboard');
  });
});
