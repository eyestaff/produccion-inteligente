import { useEffect, useState } from 'react';
import { PurchasingAPI, ReplenishmentNeed, PurchaseRequest, PurchaseStatus } from '../services/purchasing';
import { CatalogAPI, Store } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

const REASON_META: Record<string, { icon: string; badge: string; bg: string; color: string }> = {
  negative_stock:  { icon: '🚨', badge: 'Stock negativo',    bg: '#fee2e2', color: '#991b1b' },
  below_minimum:   { icon: '⚠️', badge: 'Bajo mínimo',       bg: '#fef3c7', color: '#92400e' },
  high_consumption:{ icon: '📈', badge: 'Consumo elevado',   bg: '#dbeafe', color: '#1e40af' },
  recent_waste:    { icon: '🗑️', badge: 'Merma reciente',    bg: '#f3e8ff', color: '#6b21a8' },
};

const STATUS_META: Record<PurchaseStatus, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Pendiente', bg: '#fef3c7', color: '#92400e' },
  bought:    { label: 'Comprado',  bg: '#d1fae5', color: '#065f46' },
  postponed: { label: 'Pospuesto', bg: '#f3f4f6', color: '#6b7280' },
};

export function PurchasingPage() {
  const toast = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const [needs, setNeeds] = useState<ReplenishmentNeed[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'needs' | 'requests'>('needs');
  const [acting, setActing] = useState<number | null>(null);
  const [addingToList, setAddingToList] = useState<Set<number>>(new Set());

  useEffect(() => {
    CatalogAPI.getStores().then(s => {
      setStores(s || []);
      if (s && s.length > 0) setSelectedStoreId(s[0].id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    loadData();
  }, [selectedStoreId]);

  const loadData = async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    try {
      const [n, r] = await Promise.all([
        PurchasingAPI.getNeeds(selectedStoreId),
        PurchasingAPI.getRequests(selectedStoreId),
      ]);
      setNeeds(n || []);
      setRequests(r || []);
    } catch (e: any) {
      toast(e.message || 'Error cargando datos de compras', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (need: ReplenishmentNeed) => {
    if (!selectedStoreId) return;
    setAddingToList(prev => new Set(prev).add(need.productId));
    try {
      await PurchasingAPI.createRequest(selectedStoreId, {
        productId: need.productId,
        reason: need.reason,
        suggestedQuantity: need.suggestedQuantity,
      });
      toast(`${need.productName} añadido a la lista de compra`, 'success');
      await loadData();
      setTab('requests');
    } catch (e: any) {
      toast(e.message || 'Error', 'error');
    } finally {
      setAddingToList(prev => { const s = new Set(prev); s.delete(need.productId); return s; });
    }
  };

  const handleStatusChange = async (req: PurchaseRequest, status: PurchaseStatus) => {
    setActing(req.id);
    try {
      await PurchasingAPI.updateStatus(req.id, status);
      toast(
        status === 'bought' ? `${req.productName} marcado como comprado ✓` :
        status === 'postponed' ? `${req.productName} pospuesto` : `${req.productName} pendiente`,
        'success'
      );
      await loadData();
    } catch (e: any) {
      toast(e.message || 'Error', 'error');
    } finally {
      setActing(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const boughtCount  = requests.filter(r => r.status === 'bought').length;
  const highPrioCount = needs.filter(n => n.priority <= 2).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0 }}>¿Qué debo comprar hoy?</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>
            Lista de reposición automática · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {stores.length > 0 && (
          <select
            value={selectedStoreId || ''}
            onChange={e => setSelectedStoreId(Number(e.target.value))}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', fontWeight: 500 }}
          >
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <article className="kpi-card" onClick={() => setTab('needs')} style={{ cursor: 'pointer' }}>
          <span className="kpi-label">Productos a reponer</span>
          <strong className="kpi-value" style={{ color: highPrioCount > 0 ? '#ef4444' : 'inherit' }}>{needs.length}</strong>
          <p className="kpi-detail">{highPrioCount} urgentes</p>
        </article>
        <article className="kpi-card" onClick={() => setTab('requests')} style={{ cursor: 'pointer' }}>
          <span className="kpi-label">Pendiente de compra</span>
          <strong className="kpi-value" style={{ color: pendingCount > 0 ? '#f59e0b' : 'inherit' }}>{pendingCount}</strong>
          <p className="kpi-detail">En lista de compra</p>
        </article>
        <article className="kpi-card" onClick={() => setTab('requests')} style={{ cursor: 'pointer' }}>
          <span className="kpi-label">Comprado hoy</span>
          <strong className="kpi-value" style={{ color: '#10b981' }}>{boughtCount}</strong>
          <p className="kpi-detail">Referencias gestionadas</p>
        </article>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {(['needs', 'requests'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.625rem 1.25rem', border: 'none', cursor: 'pointer',
              background: 'transparent', fontWeight: tab === t ? 700 : 400,
              color: tab === t ? 'var(--text)' : 'var(--muted)',
              borderBottom: tab === t ? '2px solid var(--text)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.15s',
            }}
          >
            {t === 'needs' ? `Necesidades detectadas (${needs.length})` : `Lista de compra (${requests.length})`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', paddingBottom: '0.5rem' }}>
          <button
            onClick={loadData}
            style={{ padding: '0.375rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.875rem' }}
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* ── TAB: NEEDS ── */}
      {tab === 'needs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
          ) : needs.length === 0 ? (
            <EmptyState
              title="Sin necesidades detectadas"
              description="El inventario de esta tienda está por encima de los mínimos configurados."
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--panel-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Producto</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Motivo</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Stock actual</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Qty. sugerida</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {needs.map(need => {
                  const meta = REASON_META[need.reason] || REASON_META.below_minimum;
                  const isAdding = addingToList.has(need.productId);
                  const alreadyInList = requests.some(r => r.productId === need.productId && r.status === 'pending');
                  return (
                    <tr key={need.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 600 }}>{need.productName}</span>
                        {need.minStock > 0 && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>
                            Mínimo: {need.minStock} · Máximo: {need.maxStock || '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: meta.bg, color: meta.color }}>
                          {meta.icon} {need.reasonLabel}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: need.currentStock < 0 ? '#ef4444' : need.currentStock === 0 ? '#f59e0b' : 'inherit' }}>
                        {need.currentStock}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                        +{need.suggestedQuantity}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {alreadyInList ? (
                          <span style={{ color: '#10b981', fontWeight: 500, fontSize: '0.875rem' }}>✓ En lista</span>
                        ) : (
                          <button
                            disabled={isAdding}
                            onClick={() => handleAddToList(need)}
                            style={{ padding: '4px 12px', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
                          >
                            {isAdding ? '…' : '+ Añadir a lista'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: REQUESTS ── */}
      {tab === 'requests' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
          ) : requests.length === 0 ? (
            <EmptyState
              title="Lista de compra vacía"
              description="Añade productos desde 'Necesidades detectadas' para comenzar tu lista de compra."
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--panel-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Producto</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Motivo</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Qty. sugerida</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Stock actual</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const meta = REASON_META[req.reason] || REASON_META.below_minimum;
                  const stMeta = STATUS_META[req.status];
                  const isActing = acting === req.id;
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border)', opacity: req.status === 'postponed' ? 0.6 : 1 }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{req.productName}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: meta.bg, color: meta.color }}>
                          {meta.icon}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#2563eb' }}>+{req.suggestedQuantity}</td>
                      <td style={{ padding: '0.875rem 1rem', color: (req.currentStock ?? 0) < 0 ? '#ef4444' : 'var(--muted)' }}>
                        {req.currentStock ?? '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: stMeta.bg, color: stMeta.color }}>
                          {stMeta.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {req.status !== 'bought' && (
                            <button
                              disabled={isActing}
                              onClick={() => handleStatusChange(req, 'bought')}
                              style={{ padding: '4px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem' }}
                            >
                              {isActing ? '…' : '✓ Comprado'}
                            </button>
                          )}
                          {req.status === 'pending' && (
                            <button
                              disabled={isActing}
                              onClick={() => handleStatusChange(req, 'postponed')}
                              style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--muted)' }}
                            >
                              Posponer
                            </button>
                          )}
                          {req.status === 'postponed' && (
                            <button
                              disabled={isActing}
                              onClick={() => handleStatusChange(req, 'pending')}
                              style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              Reactivar
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
      )}
    </div>
  );
}
