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
  pendingPurchases: number;
  weeklyProduction: number[];
  stores: Array<{ id: number; name: string; status: string; todayProduction: number }>;
  criticalStock: Array<{ name: string; stock: number; minStock: number }>;
  recentOrders: Array<{ id: number; status: string; targetQuantity: number; createdAt: string }>;
  recentMovements: Array<{ product: string; type: string; quantityChange: number; reason: string; createdAt: string }>;
  recentPurchases: Array<{ product: string; quantity: number; status: string; createdAt: string }>;
  productionStatus: { planned: number; in_progress: number; completed: number };
  forecastSummary: { produce: number; buy: number };
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

  const hasAlerts = data && (data.criticalStock.length > 0 || data.wasteToday > 0);

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

      {/* Alertas Operativas */}
      {hasAlerts && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem', color: '#b91c1c' }}>⚠️ Alertas Operativas</h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#991b1b', fontSize: '0.9rem' }}>
            {data.criticalStock.length > 0 && <li>Hay {data.criticalStock.length} productos con stock crítico (bajo el mínimo).</li>}
            {data.wasteToday > 0 && <li>Se han registrado {data.wasteToday} unidades de mermas hoy.</li>}
          </ul>
        </div>
      )}

      {/* KPIs reales */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <article className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/production')}>
          <span className="kpi-label">Producción hoy</span>
          <strong className="kpi-value" style={{ color: '#10b981' }}>{loading ? '…' : data?.productionToday ?? 0} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--muted)' }}>uds</span></strong>
          <p className="kpi-detail">{loading ? '' : `${data?.ordersToday ?? 0} órdenes completadas`}</p>
        </article>
        <article className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/production')}>
          <span className="kpi-label">Órdenes pendientes</span>
          <strong className="kpi-value" style={{ color: (data?.pendingOrders ?? 0) > 0 ? '#f59e0b' : 'inherit' }}>{loading ? '…' : data?.pendingOrders ?? 0}</strong>
          <p className="kpi-detail">Planificadas + en progreso</p>
        </article>
        <article className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/purchasing')}>
          <span className="kpi-label">Compras pendientes</span>
          <strong className="kpi-value" style={{ color: (data?.pendingPurchases ?? 0) > 0 ? '#3b82f6' : 'inherit' }}>{loading ? '…' : data?.pendingPurchases ?? 0}</strong>
          <p className="kpi-detail">Solicitudes de reposición</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Mermas hoy</span>
          <strong className="kpi-value" style={{ color: (data?.wasteToday ?? 0) > 0 ? '#ef4444' : 'inherit' }}>{loading ? '…' : data?.wasteToday ?? 0}</strong>
          <p className="kpi-detail">Unidades descartadas</p>
        </article>
        <article className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
          <span className="kpi-label">Inventario Activo</span>
          <strong className="kpi-value">{loading ? '…' : data?.inventory ?? 0}</strong>
          <p className="kpi-detail">Referencias con stock &gt; 0</p>
        </article>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
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

        {/* Forecast Resumido */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem' }}>Sugerencias del Forecast (Día Siguiente)</h3>
          {loading ? (
            <SkeletonRow />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>A producir:</span>
                <strong style={{ color: '#6366f1' }}>{data?.forecastSummary.produce} uds</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>A comprar:</span>
                <strong style={{ color: '#0ea5e9' }}>{data?.forecastSummary.buy} uds</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Inferior: Tiendas y Tablas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Producción por tienda y Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Tiendas */}
          <div className="card">
            <h3 style={{ margin: '0 0 1rem' }}>Producción por Tienda (Hoy)</h3>
            {loading ? <SkeletonRow /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(data?.stores || []).map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{s.todayProduction} uds</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estado de Producción */}
          <div className="card">
            <h3 style={{ margin: '0 0 1rem' }}>Estado de Órdenes (Hoy)</h3>
            {loading ? <SkeletonRow /> : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, padding: '1rem', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{data?.productionStatus.planned}</div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Planificadas</div>
                </div>
                <div style={{ flex: 1, padding: '1rem', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{data?.productionStatus.in_progress}</div>
                  <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>En progreso</div>
                </div>
                <div style={{ flex: 1, padding: '1rem', background: '#d1fae5', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>{data?.productionStatus.completed}</div>
                  <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Completadas</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Crítico y Movimientos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Stock critico */}
          <div className="card">
            <h3 style={{ margin: '0 0 1rem' }}>Productos con Stock Crítico</h3>
            {loading ? <SkeletonRow /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Producto</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Stock / Mín</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.criticalStock || []).length === 0 ? (
                    <tr><td colSpan={2} style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>No hay productos en stock crítico</td></tr>
                  ) : (
                    (data?.criticalStock || []).map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{p.name}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#dc2626', fontWeight: 500 }}>
                          {p.stock} / {p.minStock}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Movimientos */}
          <div className="card">
            <h3 style={{ margin: '0 0 1rem' }}>Últimos Movimientos</h3>
            {loading ? <SkeletonRow /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Producto</th>
                    <th style={{ padding: '0.5rem' }}>Tipo</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentMovements || []).length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>Sin movimientos recientes</td></tr>
                  ) : (
                    (data?.recentMovements || []).map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{m.product}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', background: m.type === 'in' ? '#d1fae5' : '#fee2e2', color: m.type === 'in' ? '#065f46' : '#991b1b' }}>{m.type}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 500 }}>{m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
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
