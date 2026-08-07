import { useEffect, useState } from 'react';
import { ProductionAPI, ProductionOrder, DashboardKPIs } from '../services/production';

export function ProductionDashboard() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError(e.message);
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
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const createMockOrder = async () => {
    try {
      // Mock Data to create a real order via API
      await ProductionAPI.createOrder({ storeId: 1, businessLineId: 1, items: [{ productId: 2, quantity: 50 }] });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando Centro de Control...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

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
          onClick={createMockOrder}
          style={{ padding: '0.5rem 1rem', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          + Nueva Orden
        </button>
      </div>

      {/* Lista de Órdenes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>No hay órdenes registradas.</td>
              </tr>
            ) : (
              orders.map(o => (
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
                      <button onClick={() => handleAction(o.id, 'cancel')} style={{ cursor: 'pointer', padding: '4px 8px', color: 'red' }}>Cancelar</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
