import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../services/api';
import { SkeletonRow } from './Skeleton';
import { EmptyState, PageCard } from './components';
import { useToast } from './ToastProvider';
import { exportToCsv } from '../utils/csv';

interface DashboardPayload {
  productionToday: number;
  ordersToday: number;
  wasteToday: number;
  inventory: number;
  pendingOrders: number;
  weeklyProduction: number[];
  stores: Array<{ name: string; status: string }>;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const toast = useToast();
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    fetchApi('/dashboard')
      .then((d: any) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const maxWeekly = data ? Math.max(...data.weeklyProduction, 1) : 1;

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Error al cargar datos');
      toast('Datos de demostración generados correctamente', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      toast('Error al generar datos', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.875rem', textTransform: 'capitalize' }}>{today}</p>
          <h2 style={{ margin: '0.25rem 0 0' }}>Centro de Operaciones</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleSeed} disabled={seeding} style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: seeding ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: seeding ? 0.7 : 1 }}>
            {seeding ? 'Cargando...' : 'Cargar Datos Demo'}
          </button>
          <button onClick={() => navigate('/production')} style={{ padding: '0.5rem 1rem', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
            Centro de Producción →
          </button>
          <button onClick={() => navigate('/inventory')} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
            Inventario →
          </button>
        </div>
      </div>

      {/* KPIs reales */}
      <div className="kpi-grid">
        <article className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/production')}>
          <span className="kpi-label">Producción hoy (unidades)</span>
          <strong className="kpi-value" style={{ color: '#10b981' }}>{loading ? '…' : data?.productionToday ?? 0}</strong>
          <p className="kpi-detail">{loading ? '' : `${data?.ordersToday ?? 0} órdenes completadas`}</p>
        </article>
        <article className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/production')}>
          <span className="kpi-label">Órdenes pendientes</span>
          <strong className="kpi-value" style={{ color: (data?.pendingOrders ?? 0) > 0 ? '#f59e0b' : 'inherit' }}>{loading ? '…' : data?.pendingOrders ?? 0}</strong>
          <p className="kpi-detail">Planificadas + en progreso</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Mermas hoy (unidades)</span>
          <strong className="kpi-value" style={{ color: (data?.wasteToday ?? 0) > 0 ? '#ef4444' : 'inherit' }}>{loading ? '…' : data?.wasteToday ?? 0}</strong>
          <p className="kpi-detail">Rotura, caducidad, pérdida</p>
        </article>
        <article className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
          <span className="kpi-label">Ref. con stock activo</span>
          <strong className="kpi-value">{loading ? '…' : data?.inventory ?? 0}</strong>
          <p className="kpi-detail">Productos con cantidad &gt; 0</p>
        </article>
      </div>

      {/* Producción semanal */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem' }}>Producción últimos 7 días</h3>
        {loading ? (
          <SkeletonRow />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px' }}>
            {(data?.weeklyProduction ?? [0,0,0,0,0,0,0]).map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${Math.max(4, (v / maxWeekly) * 100)}px`, background: 'var(--text)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>D{i+1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tiendas */}
      {data?.stores && data.stores.length > 0 && (
        <div className="card">
          <h3 style={{ margin: '0 0 1rem' }}>Tiendas activas</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {data.stores.map(s => (
              <span key={s.name} style={{ padding: '4px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 500 }}>
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
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
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!window.confirm('¿Seguro que quieres borrar los datos actuales de la empresa y generar un entorno de demostración?')) {
      return;
    }
    setSeeding(true);
    try {
      await fetchApi('/demo/seed', { method: 'POST' });
      toast('Datos demo generados correctamente. Recargando...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast(e.message || 'Error al generar demo', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-grid">
        <PageCard title="Preferencias" description="Ajuste de idioma, notificaciones y visualización." accent="#475569" />
        <PageCard title="Integraciones" description="Conexiones futuras con sistemas de negocio y servicios externos." accent="#0ea5e9" />
        <EmptyState title="Configuración inicial" description="Este espacio recoge los parámetros del sistema sin afectar la arquitectura actual." />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #fca5a5' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#991b1b' }}>Datos de Demostración (Seeding)</h3>
        <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '0.9rem' }}>
          Esta acción <strong>eliminará todos los datos de la empresa actual</strong> y generará un escenario completo de panadería (productos, recetas, inventario histórico y órdenes) para demostrar el sistema de Forecast.
        </p>
        <button 
          onClick={handleSeed} 
          disabled={seeding}
          style={{ padding: '0.75rem 1.5rem', background: seeding ? '#fca5a5' : '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: seeding ? 'not-allowed' : 'pointer', fontWeight: 600 }}
        >
          {seeding ? 'Generando...' : '⚠️ Generar Datos Demo'}
        </button>
      </div>
    </div>
  );
}
