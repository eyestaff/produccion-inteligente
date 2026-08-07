import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { APP_ROUTES, getPageTitle } from '../uiRoutes';
import { useMemo, useState } from 'react';
import { Search, Moon, Sun, ChevronRight, ChevronLeft, Menu, FileText, LogOut } from 'lucide-react';

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
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
          <div className="header__actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="search-bar" style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input type="search" placeholder="Buscar..." style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
            <button type="button" className="theme-toggle icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button 
              type="button" 
              className="icon-button" 
              onClick={() => {
                import('../services/api').then(({ logout }) => logout());
              }}
              title="Cerrar sesión"
              style={{ border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', padding: '0.6rem 0.9rem', borderRadius: '999px', cursor: 'pointer' }}
            >
              <LogOut size={18} />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Salir</span>
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
