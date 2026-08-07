import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductionAPI, DashboardKPIs } from '../services/production';
import { CatalogAPI, Store, BusinessLine } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { useStoreSelection } from '../ui/useStoreSelection';
import { EmptyState } from '../ui/EmptyState';
import { CreateOrderModal } from '../components/production/CreateOrderModal';
import { exportToCsv } from '../utils/csv';
import { Printer } from 'lucide-react';

interface ProductionOrderEnriched {
  id: number;
  storeId: number;
  storeName?: string;
  businessLineId: number;
  targetQuantity: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  items: { productId: number; productName?: string; quantity: number }[];
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  planned:     { label: 'Planificada',  bg: '#f3f4f6', color: '#374151' },
  in_progress: { label: 'En Progreso',  bg: '#fef3c7', color: '#92400e' },
  completed:   { label: 'Completada',   bg: '#d1fae5', color: '#065f46' },
  cancelled:   { label: 'Cancelada',    bg: '#fee2e2', color: '#991b1b' },
};

export function ProductionDashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useStoreSelection();
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [orders, setOrders] = useState<ProductionOrderEnriched[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = async () => {
    if (!selectedStoreId) return;
    try {
      setLoading(true);
      const [fetchedOrders, fetchedKpis] = await Promise.all([
        ProductionAPI.listOrders(),
        ProductionAPI.getDashboard()
      ]);
      const filteredOrders = ((fetchedOrders as unknown as ProductionOrderEnriched[]) || []).filter(o => o.storeId === selectedStoreId);
      setOrders(filteredOrders);
      setKpis(fetchedKpis);
    } catch (e: any) {
      toast(e.message || 'Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    CatalogAPI.getStores().then(s => {
      setStores(s || []);
      if (s && s.length > 0 && !selectedStoreId) setSelectedStoreId(s[0].id);
      else if (s && s.length === 0) setLoading(false);
    });
    CatalogAPI.getBusinessLines().then(b => setBusinessLines(b || []));
  }, []);

  useEffect(() => {
    if (selectedStoreId) loadData();
  }, [selectedStoreId]);

  const handleAction = async (id: number, storeId: number, action: 'start' | 'complete' | 'cancel') => {
    if (action === 'cancel' && !confirm('¿Confirmas la cancelación de esta orden?')) return;
    setActionLoading(id);
    try {
      if (action === 'start') await ProductionAPI.startOrder(id);
      if (action === 'complete') await ProductionAPI.completeOrder(id);
      if (action === 'cancel') await ProductionAPI.cancelOrder(id);
      const msgs = { start: 'Producción iniciada', complete: 'Producción completada — Stock actualizado automáticamente', cancel: 'Orden cancelada' };
      toast(msgs[action], 'success');
      if (action === 'complete') {
        setTimeout(() => navigate('/inventory'), 1500);
      } else {
        loadData();
      }
    } catch (e: any) {
      toast(e.message || 'Error en la acción', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getProductLabel = (o: ProductionOrderEnriched) => {
    if (o.items && o.items.length > 0) {
      return o.items.map(i => `${i.productName || 'Producto #' + i.productId} (×${i.quantity})`).join(', ');
    }
    return `${o.targetQuantity} unidades`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* KPIs */}
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
          <span className="kpi-label">Completadas hoy</span>
          <strong className="kpi-value" style={{ color: '#10b981' }}>{kpis?.completed || 0}</strong>
        </article>
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Órdenes de Producción</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {orders.length > 0 && (
            <button
              onClick={() => {
                const rows = orders.map(o => [
                  `ORD-${o.id.toString().padStart(4, '0')}`,
                  getProductLabel(o),
                  o.storeName || 'Tienda #' + o.storeId,
                  STATUS_LABELS[o.status]?.label || o.status
                ]);
                exportToCsv('ordenes-produccion', ['Orden', 'Producto(s)', 'Tienda', 'Estado'], rows);
              }}
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
            >
              Exportar CSV
            </button>
          )}
          <button onClick={() => navigate('/inventory')} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
            Ver Inventario
          </button>
          <button onClick={() => setShowModal(true)} style={{ padding: '0.5rem 1rem', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
            + Nueva Orden
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="Sin órdenes pendientes"
            description="No hay producción planificada para hoy."
            action={<button onClick={() => setShowModal(true)} style={{ padding: '0.5rem 1rem', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Planificar ahora</button>}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--panel-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Orden</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Producto(s)</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Tienda</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Estado</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const st = STATUS_LABELS[o.status] || STATUS_LABELS.planned;
                const isLoading = actionLoading === o.id;
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontFamily: 'monospace' }}>ORD-{o.id.toString().padStart(4, '0')}</td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '280px', fontWeight: 500 }}>{getProductLabel(o)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{o.storeName || 'Tienda #' + o.storeId}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {o.status === 'planned' && (
                          <button disabled={isLoading} onClick={() => handleAction(o.id, o.storeId, 'start')} style={{ cursor: 'pointer', padding: '4px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 500, fontSize: '0.875rem' }}>
                            {isLoading ? '…' : 'Iniciar'}
                          </button>
                        )}
                        {o.status === 'in_progress' && (
                          <button disabled={isLoading} onClick={() => handleAction(o.id, o.storeId, 'complete')} style={{ cursor: 'pointer', padding: '4px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 500, fontSize: '0.875rem' }}>
                            {isLoading ? '…' : '✓ Completar'}
                          </button>
                        )}
                        {o.status === 'completed' && (
                          <button onClick={() => navigate('/inventory')} style={{ cursor: 'pointer', padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.875rem' }}>
                            Ver stock →
                          </button>
                        )}
                        <button onClick={() => window.print()} title="Imprimir orden" style={{ cursor: 'pointer', padding: '4px', background: 'transparent', border: 'none', color: 'var(--muted)' }}>
                          <Printer size={18} />
                        </button>
                        {(o.status === 'planned' || o.status === 'in_progress') && (
                          <button disabled={isLoading} onClick={() => handleAction(o.id, o.storeId, 'cancel')} style={{ cursor: 'pointer', padding: '4px 8px', color: '#ef4444', border: 'none', background: 'transparent', fontSize: '0.875rem' }}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
