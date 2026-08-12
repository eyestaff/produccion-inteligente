export interface AppRoute {
  path: string;
  title: string;
  description: string;
}

export const APP_ROUTES: AppRoute[] = [
  { path: '/dashboard', title: 'Dashboard', description: 'Resumen general del estado del negocio' },
  { path: '/forecast', title: 'Forecast', description: 'Predicciones y sugerencias de IA' },
  { path: '/production', title: 'Producción', description: 'Seguimiento de la producción diaria' },
  { path: '/inventory', title: 'Inventario', description: 'Control del inventario y activos' },
  {
    path: '/purchasing',
    title: 'Compras',
    description: 'Lista de reposición y gestión de compras',
  },
  { path: '/waste', title: 'Mermas', description: 'Gestión y análisis de mermas' },
  { path: '/products', title: 'Productos', description: 'Catálogo de productos y variantes' },
  { path: '/recipes', title: 'Recetas', description: 'Recetas y composición de productos' },
  { path: '/reports', title: 'Reportes', description: 'Reportes ejecutivos y operativos' },
  { path: '/configuration', title: 'Configuración', description: 'Opciones de la plataforma' },
];

export function getRouteByPathname(pathname: string): AppRoute {
  const normalizedPathname = pathname === '/' ? '/dashboard' : pathname;
  return APP_ROUTES.find((route) => route.path === normalizedPathname) ?? APP_ROUTES[0];
}

export function getPageTitle(pathname: string): string {
  return getRouteByPathname(pathname).title;
}
