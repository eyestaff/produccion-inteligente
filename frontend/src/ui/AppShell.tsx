import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { APP_ROUTES, getPageTitle } from '../uiRoutes';
import { useMemo, useState } from 'react';

interface AppShellProps {
  title?: string;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AppShell({ title }: AppShellProps) {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  return (
    <div className={classNames('app-shell', theme === 'dark' && 'theme-dark', sidebarCollapsed && 'app-shell--collapsed')}>
      <aside className={classNames('sidebar', sidebarCollapsed && 'sidebar--collapsed')}>
        <div className="sidebar__brand">
          <div className="brand-mark">PI</div>
          {!sidebarCollapsed && (
            <div>
              <h1>Producción Inteligente</h1>
              <p>Operación y trazabilidad</p>
            </div>
          )}
        </div>

        <button type="button" className="icon-button" onClick={() => setSidebarCollapsed((value) => !value)}>
          {sidebarCollapsed ? '›' : '‹'}
        </button>

        <nav className="sidebar__nav" aria-label="Navegación principal">
          {APP_ROUTES.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) => classNames('nav-link', isActive && 'nav-link--active')}
              title={route.title}
            >
              <span>{sidebarCollapsed ? route.title.charAt(0) : route.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-panel">
        <header className="header">
          <div>
            <p className="eyebrow">Vista actual</p>
            <h2>{title ?? currentTitle}</h2>
          </div>
          <div className="header__actions">
            <button type="button" className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? 'Oscuro' : 'Claro'}
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
