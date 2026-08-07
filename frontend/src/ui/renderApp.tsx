import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppRoutes } from './AppRoutes';

export function renderAppToHtml(pathname: string): string {
  const appMarkup = renderToString(
    <StaticRouter location={pathname}>
      <AppRoutes />
    </StaticRouter>,
  );

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Producción inteligente</title>
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="stylesheet" href="/assets/ui-app.css" />
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.5;
        font-weight: 400;
        --bg: #f4f7fb;
        --panel: #ffffff;
        --panel-muted: #eef2ff;
        --border: #dbe4f0;
        --text: #172033;
        --muted: #5b6b85;
        --accent: #2563eb;
      }
      body { margin: 0; background: var(--bg); color: var(--text); }
      * { box-sizing: border-box; }
      #root { min-height: 100vh; }
      .app-shell { min-height: 100vh; display: grid; grid-template-columns: 280px minmax(0, 1fr); background: var(--bg); color: var(--text); }
      .theme-dark { color-scheme: dark; --bg: #07111f; --panel: #111c2d; --panel-muted: #17253b; --border: #243449; --text: #f1f5f9; --muted: #9fb0c7; --accent: #60a5fa; }
      .sidebar { background: linear-gradient(180deg, var(--panel) 0%, var(--panel-muted) 100%); border-right: 1px solid var(--border); padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 1.5rem; }
      .sidebar__brand { display: flex; align-items: center; gap: 0.75rem; }
      .sidebar__brand h1 { margin: 0; font-size: 1rem; }
      .sidebar__brand p { margin: 0.2rem 0 0; color: var(--muted); font-size: 0.9rem; }
      .brand-mark { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--accent); color: white; font-weight: 700; }
      .sidebar__nav { display: flex; flex-direction: column; gap: 0.35rem; }
      .nav-link { text-decoration: none; color: var(--text); padding: 0.8rem 0.95rem; border-radius: 12px; font-weight: 600; }
      .nav-link:hover, .nav-link--active { background: var(--accent); color: #fff; }
      .main-panel { display: flex; flex-direction: column; }
      .header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.55); backdrop-filter: blur(8px); }
      .theme-dark .header { background: rgba(7,17,31,0.8); }
      .eyebrow { margin: 0 0 0.2rem; font-size: 0.8rem; text-transform: uppercase; color: var(--muted); letter-spacing: 0.08em; }
      .header h2 { margin: 0; font-size: 1.2rem; }
      .theme-toggle { border: 1px solid var(--border); background: var(--panel); color: var(--text); padding: 0.6rem 0.9rem; border-radius: 999px; cursor: pointer; }
      .content { padding: 1.5rem; }
      .page-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
      .card, .empty-state { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06); }
      .card { border-left: 4px solid var(--accent); }
      .card h3, .empty-state h3 { margin: 0 0 0.4rem; }
      .card p, .empty-state p { margin: 0; color: var(--muted); }
      @media (max-width: 900px) { .app-shell { grid-template-columns: 1fr; } .sidebar { border-right: none; border-bottom: 1px solid var(--border); } }
    </style>
  </head>
  <body>
    <div id="root">${appMarkup}</div>
    <script type="module" src="/assets/ui-entry.js"></script>
  </body>
</html>`;
}
