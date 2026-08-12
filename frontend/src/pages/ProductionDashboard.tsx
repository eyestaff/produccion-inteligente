import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductionAPI, DashboardKPIs } from '../services/production';
import { CatalogAPI, Store, BusinessLine } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { useStoreSelection } from '../ui/useStoreSelection';
import { EmptyState } from '../ui/EmptyState';
import { CreateOrderModal } from '../components/production/CreateOrderModal';
import { CompleteOrderModal } from '../components/production/CompleteOrderModal';
import { PrepSheetModal } from '../components/production/PrepSheetModal';
import { ForecastAPI, ForecastRecommendation } from '../services/forecast';
import { exportToCsv } from '../utils/csv';
import { Printer, Zap } from 'lucide-react';

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
  const [suggestions, setSuggestions] = useState<ForecastRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<any | null>(null);
  const [orderForSheet, setOrderForSheet] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = async () => {
    if (!selectedStoreId) return;
    try {
      setLoading(true);
      const [fetchedOrders, fetchedKpis, forecast] = await Promise.all([
        ProductionAPI.listOrders(),
        ProductionAPI.getDashboard(),
        ForecastAPI.getDashboard(selectedStoreId)
      ]);
      const filteredOrders = ((fetchedOrders as unknown as ProductionOrderEnriched[]) || []).filter(o => o.storeId === selectedStoreId);
      setOrders(filteredOrders);
      setKpis(fetchedKpis);
      setSuggestions(forecast?.recommendations?.filter(r => r.type === 'produce') || []);
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
    <div className="content animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <p className="eyebrow">Gestión Operativa</p>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Órdenes de Producción
          </h2>
        </div>
        <div className="flex-end gap-2">
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
              className="btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Exportar CSV
            </button>
          )}
          <button onClick={() => navigate('/inventory')} className="btn-secondary">
            Ver Inventario
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Nueva Orden
          </button>
        </div>
      </div>

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

      {/* Suggested Production (Forecast) */}
      {suggestions.length > 0 && (
        <div className="card animate-in animate-delay-1" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
            <Zap size={18} /> Sugerencias de Hoy (Inteligencia Artificial)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {suggestions.map(s => (
              <div key={s.productId} style={{ background: 'var(--panel)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{s.productName}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Producir: <strong style={{ color: 'var(--text)' }}>{s.suggestedQuantity}</strong> uds</div>
                <button 
                  onClick={() => setShowModal(true)} 
                  className="btn-primary"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }}
                >
                  Planificar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card animate-in animate-delay-2" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
        ) : orders.length === 0 ? (
          <div style={{ border: 'none' }} className="empty-state">
            <h3>Sin órdenes pendientes</h3>
            <p>No hay producción planificada para hoy.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Planificar ahora</button>
          </div>
        ) : (
          <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Producto(s)</th>
                <th>Tienda</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const st = STATUS_LABELS[o.status] || STATUS_LABELS.planned;
                const isLoading = actionLoading === o.id;
                return (
                  <tr key={o.id}>
                    <td style={{ color: 'var(--muted)', fontFamily: 'monospace', fontWeight: 600 }}>ORD-{o.id.toString().padStart(4, '0')}</td>
                    <td style={{ maxWidth: '280px', fontWeight: 600 }}>{getProductLabel(o)}</td>
                    <td style={{ color: 'var(--muted)' }}>{o.storeName || 'Tienda #' + o.storeId}</td>
                    <td className="text-center">
                      <span className="badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}33` }}>{st.label}</span>
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                        {o.status === 'planned' && (
                          <button disabled={isLoading} onClick={() => handleAction(o.id, o.storeId, 'start')} className="btn-primary" style={{ padding: '0.25rem 0.75rem' }}>
                            {isLoading ? '…' : 'Iniciar'}
                          </button>
                        )}
                        {o.status === 'in_progress' && (
                          <>
                            <button disabled={isLoading} onClick={() => setOrderForSheet(o)} className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>
                              Ver Receta
                            </button>
                            <button disabled={isLoading} onClick={() => setOrderToComplete(o)} className="btn-primary" style={{ padding: '0.25rem 0.75rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                              {isLoading ? '…' : '✓ Completar'}
                            </button>
                          </>
                        )}
                        {o.status === 'completed' && (
                          <button onClick={() => navigate('/inventory')} className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>
                            Ver stock →
                          </button>
                        )}
                        <button onClick={() => window.print()} title="Imprimir orden" style={{ cursor: 'pointer', padding: '0.25rem', background: 'transparent', border: 'none', color: 'var(--muted)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text)'} onMouseOut={e => e.currentTarget.style.color = 'var(--muted)'}>
                          <Printer size={18} />
                        </button>
                        {(o.status === 'planned' || o.status === 'in_progress') && (
                          <button disabled={isLoading} onClick={() => handleAction(o.id, o.storeId, 'cancel')} style={{ cursor: 'pointer', padding: '0.25rem 0.5rem', color: '#ef4444', border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 600, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.7'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
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
          </div>
        )}
      </div>

      {showModal && (
        <CreateOrderModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadData(); }} />
      )}
      {orderToComplete && (
        <CompleteOrderModal order={orderToComplete} onClose={() => setOrderToComplete(null)} onSuccess={() => { setOrderToComplete(null); loadData(); }} />
      )}
      {orderForSheet && (
        <PrepSheetModal order={orderForSheet} onClose={() => setOrderForSheet(null)} />
      )}
    </div>
  );
}
