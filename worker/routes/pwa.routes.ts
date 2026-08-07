import { MANIFEST, SERVICE_WORKER, ICON_SVG } from '../pwa';
import { renderAppToHtml } from '../../frontend/src/ui/renderApp';
import { HTML } from '../html';

export async function handlePwaRoute(pathname: string): Promise<Response | null> {
  if (pathname === '/manifest.webmanifest') {
    return new Response(MANIFEST, { headers: { 'Content-Type': 'application/manifest+json' } });
  }

  if (pathname === '/sw.js') {
    return new Response(SERVICE_WORKER, {
      headers: { 'Content-Type': 'application/javascript' },
    });
  }

  if (pathname === '/icon.svg') {
    return new Response(ICON_SVG, { headers: { 'Content-Type': 'image/svg+xml' } });
  }

  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/dashboard' ||
    pathname === '/production' ||
    pathname === '/inventory' ||
    pathname === '/configuration'
  ) {
    return new Response(renderAppToHtml(pathname), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  }

  if (!pathname.startsWith('/api/') && !pathname.startsWith('/assets/') && pathname !== '/health') {
    return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  return null;
}
