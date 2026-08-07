content = """import { useEffect, useState } from 'react';
import { ProductionAPI, ProductionOrder, DashboardKPIs } from '../services/production';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { CreateOrderModal } from '../components/production/CreateOrderModal';

export function ProductionDashboard() {
  const toast = useToast();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedOrders, fetchedKpis] = await Promise.all([
        ProductionAPI.listOrders(),
        ProductionAPI.getDashboard()
      ]);
      setOrders(fetchedOrders || []);
      setKpis(fetchedKpis);
    } catch (e: any) {
      toast(e.message || 'Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: number, action: 'start' | 'complete' | 'cancel') => {
    try {
      if (action === 'start') await ProductionAPI.startOrder(id);
      if (action === 'complete') await ProductionAPI.completeOrder(id);
      if (action === 'cancel') await ProductionAPI.cancelOrder(id);
      toast(`Orden ${action === 'complete' ? 'completada' : action === 'start' ? 'iniciada' : 'cancelada'}`, 'success');
      loadData();
    } catch (e: any) {
      toast(e.message || 'Error en la acción', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* KPIs Grid */}
      <div className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-label">Planificadas</span>
          <strong className="kpi-value">{kpis?.planned || 0}</strong>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">En Progreso</span>
          <strong className="kpi-value" style={{ color: '#f59e0b' }}>{kpis?.inProgress || 0}</strong>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Completadas</span>
          <strong className="kpi-value" style={{ color: '#10b981' }}>{kpis?.completed || 0}</strong>
        </article>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Órdenes de Producción</h3>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '0.5rem 1rem', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
          + Nueva Orden
        </button>
      </div>

      {/* Lista de Órdenes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState title="Sin órdenes pendientes" description="No hay producción planificada para hoy." action={<button onClick={() => setShowModal(true)} style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Planificar ahora</button>} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--panel-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Cantidad</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Estado</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>ORD-{o.id.toString().padStart(4, '0')}</td>
                  <td style={{ padding: '1rem' }}>{o.targetQuantity} unid.</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
                      background: o.status === 'completed' ? '#d1fae5' : o.status === 'in_progress' ? '#fef3c7' : '#f3f4f6',
                      color: o.status === 'completed' ? '#065f46' : o.status === 'in_progress' ? '#92400e' : '#374151'
                    }}>
                      {o.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    {o.status === 'planned' && (
                      <button onClick={() => handleAction(o.id, 'start')} style={{ cursor: 'pointer', padding: '4px 8px' }}>Iniciar</button>
                    )}
                    {o.status === 'in_progress' && (
                      <button onClick={() => handleAction(o.id, 'complete')} style={{ cursor: 'pointer', padding: '4px 8px', background: '#10b981', color: 'white', border: 'none' }}>Completar (Backflush)</button>
                    )}
                    {(o.status === 'planned' || o.status === 'in_progress') && (
                      <button onClick={() => handleAction(o.id, 'cancel')} style={{ cursor: 'pointer', padding: '4px 8px', color: 'red', border: 'none', background: 'transparent' }}>Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CreateOrderModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadData(); }} />
      )}
    </div>
  );
}
"""
with open('frontend/src/pages/ProductionDashboard.tsx', 'w') as f:
    f.write(content)
