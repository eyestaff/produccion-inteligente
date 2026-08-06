import { useEffect, useMemo, useState } from 'react';
import { EmptyState, PageCard } from './components';

interface DashboardPayload {
  productionToday: number;
  wastePercent: number;
  inventory: number;
  forecast: number;
  weeklyProduction: number[];
  stores: Array<{ name: string; status: string }>;
}

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('No se pudieron cargar los datos del dashboard.');
        }

        const payload = (await response.json()) as DashboardPayload;
        if (active) {
          setDashboardData(payload);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos del dashboard.');
          setDashboardData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const kpis = useMemo(() => {
    if (!dashboardData) {
      return [
        { label: 'Producción hoy', value: loading ? 'Cargando…' : '--', detail: 'Pendiente de carga' },
        { label: 'Residuos', value: loading ? 'Cargando…' : '--', detail: 'Sin datos aún' },
        { label: 'Inventario', value: loading ? 'Cargando…' : '--', detail: 'En espera' },
        { label: 'Pronóstico', value: loading ? 'Cargando…' : '--', detail: 'Por confirmar' },
      ];
    }

    return [
      { label: 'Producción hoy', value: `${dashboardData.productionToday}`, detail: 'Simulado desde la API' },
      { label: 'Residuos', value: `${dashboardData.wastePercent}%`, detail: 'Porcentaje estimado' },
      { label: 'Inventario', value: `${dashboardData.inventory}`, detail: 'Unidades disponibles' },
      { label: 'Pronóstico', value: `${dashboardData.forecast}`, detail: 'Proyección del día' },
    ];
  }, [dashboardData, loading]);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero card">
        <div>
          <p className="eyebrow">Panel inicial</p>
          <h3>Vista general de la operación</h3>
          <p>
            Este dashboard consume los datos simulados del endpoint de la fase 1 y muestra la estructura visual del
            panel inicial.
          </p>
        </div>
      </section>

      {error ? (
        <section className="card error-card">
          <h3>No se pudieron cargar los datos</h3>
          <p>{error}</p>
        </section>
      ) : null}

      <div className="kpi-grid" aria-label="Indicadores clave">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="kpi-card">
            <span className="kpi-label">{kpi.label}</span>
            <strong className="kpi-value">{kpi.value}</strong>
            <p className="kpi-detail">{kpi.detail}</p>
          </article>
        ))}
      </div>

      {dashboardData ? (
        <div className="dashboard-section">
          <section className="card">
            <h3>Producción semanal</h3>
            <div className="chart-bars" aria-label="Producción semanal">
              {dashboardData.weeklyProduction.map((value, index) => (
                <div key={`${value}-${index}`} className="bar-item">
                  <div className="bar-fill" style={{ height: `${Math.max(12, value / 2)}px` }} />
                  <span className="bar-label">{index + 1}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Tiendas</h3>
            <ul className="store-list">
              {dashboardData.stores.map((store) => (
                <li key={store.name} className="store-item">
                  <span>{store.name}</span>
                  <span className="store-status">{store.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      <div className="page-grid">
        <PageCard title="Resumen diario" description="Vista general del desempeño operativo y los principales indicadores." accent="#2563eb" />
        <PageCard title="Alertas" description="Se mostrarán incidentes y eventos críticos en el futuro." accent="#f59e0b" />
        <PageCard title="Objetivos" description="Seguimiento de metas y cumplimiento de la producción." accent="#10b981" />
        <EmptyState title="Contenido de ejemplo" description="Esta pantalla está preparada para recibir información real en la siguiente fase." />
      </div>
    </div>
  );
}

export function ProductionPage() {
  return (
    <div className="page-grid">
      <PageCard title="Programación" description="Planificación de tareas y turnos del equipo." accent="#6366f1" />
      <PageCard title="Rendimiento" description="Comparativa del avance actual frente a la meta." accent="#8b5cf6" />
      <EmptyState title="Producción pendiente" description="La lógica de negocio se añadirá en una fase posterior." />
    </div>
  );
}

export function InventoryPage() {
  return (
    <div className="page-grid">
      <PageCard title="Inventario activo" description="Visión general de materiales y recursos disponibles." accent="#0f766e" />
      <PageCard title="Movimientos" description="Historial de entradas y salidas por almacén." accent="#ec4899" />
      <EmptyState title="Sin datos todavía" description="Los registros reales se integrarán cuando se conecte la fuente de información." />
    </div>
  );
}

export function ProductsPage() {
  return (
    <div className="page-grid">
      <PageCard title="Catálogo" description="Listado de productos principales y variantes de negocio." accent="#16a34a" />
      <PageCard title="Disponibilidad" description="Estado de inventario asociado a cada producto." accent="#0ea5e9" />
      <EmptyState title="Productos ejemplo" description="Esta vista representa la estructura de la página sin integrar datos reales." />
    </div>
  );
}

export function RecipesPage() {
  return (
    <div className="page-grid">
      <PageCard title="Recetas activas" description="Recetas y fórmulas de elaboración para la operación." accent="#7c3aed" />
      <PageCard title="Versiones" description="Control de cambios en las formulaciones y parámetros." accent="#dc2626" />
      <EmptyState title="Recetas de ejemplo" description="El contenido de esta sección se usará para mostrar la jerarquía de preparación." />
    </div>
  );
}

export function ConfigurationPage() {
  return (
    <div className="page-grid">
      <PageCard title="Preferencias" description="Ajuste de idioma, notificaciones y visualización." accent="#475569" />
      <PageCard title="Integraciones" description="Conexiones futuras con sistemas de negocio y servicios externos." accent="#0ea5e9" />
      <EmptyState title="Configuración inicial" description="Este espacio recoge los parámetros del sistema sin afectar la arquitectura actual." />
    </div>
  );
}
