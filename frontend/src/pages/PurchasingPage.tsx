import { useEffect, useState } from 'react';
import {
  PurchasingAPI,
  ReplenishmentNeed,
  PurchaseRequest,
  PurchaseStatus,
  DISCARD_REASONS,
} from '../services/purchasing';
import { CatalogAPI, Store } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

// ─── Design tokens for each reason ──────────────────────────────────────────
const REASON_META: Record<string, { icon: string; label: string; urgency: 'critical' | 'warning' | 'info'; bg: string; border: string; color: string; badgeBg: string; badgeColor: string }> = {
  negative_stock:  { icon: '🚨', label: 'Stock negativo',    urgency: 'critical', bg: '#fff5f5', border: '#fca5a5', color: '#7f1d1d', badgeBg: '#fee2e2', badgeColor: '#991b1b' },
  below_minimum:   { icon: '⚠️', label: 'Bajo mínimo',       urgency: 'warning',  bg: '#fffbeb', border: '#fcd34d', color: '#78350f', badgeBg: '#fef3c7', badgeColor: '#92400e' },
  high_consumption:{ icon: '📈', label: 'Consumo elevado',   urgency: 'info',     bg: '#eff6ff', border: '#93c5fd', color: '#1e3a8a', badgeBg: '#dbeafe', badgeColor: '#1e40af' },
  recent_waste:    { icon: '🗑️', label: 'Merma reciente',    urgency: 'info',     bg: '#f5f3ff', border: '#c4b5fd', color: '#3b0764', badgeBg: '#ede9fe', badgeColor: '#6d28d9' },
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Pendiente', bg: '#fef3c7', color: '#92400e' },
  bought:    { label: 'Comprado',  bg: '#d1fae5', color: '#065f46' },
  postponed: { label: 'Pospuesto', bg: '#f3f4f6', color: '#6b7280' },
  discarded: { label: 'Descartado', bg: '#f3f4f6', color: '#9ca3af' },
};

// ─── Discard modal ───────────────────────────────────────────────────────────
function DiscardModal({ productName, onConfirm, onCancel }: {
  productName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string>('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Descartar recomendación</h3>
        <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
          ¿Por qué descartas <strong>{productName}</strong>? Esto ayudará al sistema a mejorar.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {DISCARD_REASONS.map(r => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', border: `1px solid ${selected === r ? '#2563eb' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer', background: selected === r ? '#eff6ff' : 'white', transition: 'all 0.15s' }}>
              <input type="radio" name="discard_reason" value={r} checked={selected === r} onChange={() => setSelected(r)} style={{ accentColor: '#2563eb' }} />
              <span style={{ fontSize: '0.9rem' }}>{r}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Cancelar</button>
          <button
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
            style={{ padding: '0.5rem 1rem', background: selected ? '#ef4444' : '#fca5a5', color: 'white', border: 'none', borderRadius: '6px', cursor: selected ? 'pointer' : 'not-allowed', fontWeight: 500 }}
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Need detail card ────────────────────────────────────────────────────────
function NeedCard({ need, isInList, isAdding, isDiscarding, onAdd, onDiscard }: {
  need: ReplenishmentNeed;
  isInList: boolean;
  isAdding: boolean;
  isDiscarding: boolean;
  onAdd: () => void;
  onDiscard: () => void;
}) {
  const [expanded, setExpanded] = useState(need.priority <= 1);
  const meta = REASON_META[need.reason] || REASON_META.below_minimum;
  const dailyRate = need.consumption7d > 0 ? (need.consumption7d / 7).toFixed(1) : null;

  return (
    <div style={{
      border: `1px solid ${meta.border}`,
      borderLeft: `4px solid ${meta.border}`,
      borderRadius: '10px',
      background: meta.bg,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Card header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{meta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: meta.color }}>{need.productName}</span>
            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, background: meta.badgeBg, color: meta.badgeColor }}>
              {meta.label}
            </span>
            {need.daysOfStockRemaining !== null && need.daysOfStockRemaining <= 2 && (
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>
                ⏱ {need.daysOfStockRemaining === 0 ? 'Se agota hoy' : `${need.daysOfStockRemaining}d restante`}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: meta.color }}>Stock: <strong>{need.currentStock}</strong></span>
            {need.minStock > 0 && <span style={{ fontSize: '0.8rem', color: meta.color }}>Mín: <strong>{need.minStock}</strong></span>}
            {need.maxStock > 0 && <span style={{ fontSize: '0.8rem', color: meta.color }}>Máx: <strong>{need.maxStock}</strong></span>}
            {dailyRate && <span style={{ fontSize: '0.8rem', color: meta.color }}>~{dailyRate}/día</span>}
          </div>
        </div>

        {/* Suggested qty highlight */}
        <div style={{ textAlign: 'center', padding: '0.5rem 0.75rem', background: 'white', borderRadius: '8px', border: `1px solid ${meta.border}`, minWidth: '72px' }}>
          <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>COMPRAR</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', lineHeight: 1.1 }}>+{need.suggestedQuantity}</div>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>unidades</div>
        </div>

        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${meta.border}`, padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.7)' }}>
          {/* Context grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <ContextCell label="Stock físico" value={`${need.physicalStock} u`} />
            <ContextCell label="Stock disponible" value={`${need.currentStock} u`} highlight={need.currentStock < 0} />
            <ContextCell label="Reservado" value={`${need.reservedQuantity} u`} />
            <ContextCell label="Mínimo configurado" value={need.minStock > 0 ? `${need.minStock} u` : '—'} />
            <ContextCell label="Máximo configurado" value={need.maxStock > 0 ? `${need.maxStock} u` : '—'} />
            <ContextCell label="Consumo 7 días" value={need.consumption7d > 0 ? `${need.consumption7d} u` : '—'} />
            {need.recentWaste48h > 0 && <ContextCell label="Merma 48h" value={`${need.recentWaste48h} u`} highlight />}
            <ContextCell label="Días restantes" value={need.daysOfStockRemaining !== null ? `${need.daysOfStockRemaining}d` : '—'} />
            <ContextCell label="Objetivo reposición" value={`${need.targetStock} u`} />
          </div>

          {/* Impact block */}
          <div style={{ background: need.priority <= 2 ? '#fee2e2' : '#fef9c3', border: `1px solid ${need.priority <= 2 ? '#fca5a5' : '#fde68a'}`, borderRadius: '8px', padding: '0.875rem', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: need.priority <= 2 ? '#7f1d1d' : '#78350f' }}>
              {need.priority <= 2 ? '🔴' : '🟡'} <strong>¿Qué pasará si no lo compras?</strong>
            </p>
            <p style={{ margin: '0.375rem 0 0', fontSize: '0.85rem', color: need.priority <= 2 ? '#991b1b' : '#92400e', lineHeight: 1.5 }}>
              {need.impactIfNotBought}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isInList ? (
              <span style={{ padding: '0.5rem 1rem', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem' }}>
                ✓ En lista de compra
              </span>
            ) : (
              <button
                disabled={isAdding}
                onClick={onAdd}
                style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                {isAdding ? '…' : '+ Añadir a lista de compra'}
              </button>
            )}
            <button
              disabled={isDiscarding}
              onClick={onDiscard}
              style={{ padding: '0.5rem 0.875rem', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', color: '#6b7280', fontSize: '0.8rem' }}
            >
              {isDiscarding ? '…' : 'Descartar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContextCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: 'white', borderRadius: '6px', padding: '0.5rem 0.75rem', border: highlight ? '1px solid #fca5a5' : '1px solid #f3f4f6' }}>
      <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: highlight ? '#ef4444' : '#111827', marginTop: '0.125rem' }}>{value}</div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export function PurchasingPage() {
  const toast = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [needs, setNeeds] = useState<ReplenishmentNeed[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'needs' | 'requests'>('needs');
  const [addingProductIds, setAddingProductIds] = useState<Set<number>>(new Set());
  const [acting, setActing] = useState<number | null>(null);
  // Discard modal state
  const [discardTarget, setDiscardTarget] = useState<{ id?: number; need?: ReplenishmentNeed; storeId: number } | null>(null);
  const [discardingProductIds, setDiscardingProductIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    CatalogAPI.getStores().then(s => {
      setStores(s || []);
      if (s && s.length > 0) setSelectedStoreId(s[0].id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedStoreId) loadData();
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
    setAddingProductIds(p => new Set(p).add(need.productId));
    try {
      await PurchasingAPI.createRequest(selectedStoreId, { productId: need.productId, reason: need.reason, suggestedQuantity: need.suggestedQuantity });
      toast(`${need.productName} añadido a la lista de compra`, 'success');
      await loadData();
      setTab('requests');
    } catch (e: any) {
      toast(e.message || 'Error', 'error');
    } finally {
      setAddingProductIds(p => { const s = new Set(p); s.delete(need.productId); return s; });
    }
  };

  const handleDiscard = async (reason: string) => {
    if (!discardTarget || !selectedStoreId) return;
    // Discard from requests list
    if (discardTarget.id) {
      setActing(discardTarget.id);
      try {
        await PurchasingAPI.discard(discardTarget.id, reason);
        toast('Recomendación descartada', 'success');
        await loadData();
      } catch (e: any) {
        toast(e.message || 'Error', 'error');
      } finally {
        setActing(null);
      }
    }
    // Discard directly from needs — create request first then discard
    if (discardTarget.need) {
      const n = discardTarget.need;
      setDiscardingProductIds(p => new Set(p).add(n.productId));
      try {
        const result = await PurchasingAPI.createRequest(selectedStoreId, { productId: n.productId, reason: n.reason, suggestedQuantity: n.suggestedQuantity }) as any;
        if (result?.id) await PurchasingAPI.discard(result.id, reason);
        toast(`${n.productName} descartado`, 'success');
        await loadData();
      } catch (e: any) {
        toast(e.message || 'Error', 'error');
      } finally {
        setDiscardingProductIds(p => { const s = new Set(p); s.delete(n.productId); return s; });
      }
    }
    setDiscardTarget(null);
  };

  const handleStatusChange = async (req: PurchaseRequest, status: PurchaseStatus) => {
    setActing(req.id);
    try {
      await PurchasingAPI.updateStatus(req.id, status);
      const msgs: Record<string, string> = { bought: `${req.productName} marcado como comprado ✓`, postponed: `${req.productName} pospuesto`, pending: `${req.productName} reactivado` };
      toast(msgs[status] || 'Actualizado', 'success');
      await loadData();
    } catch (e: any) {
      toast(e.message || 'Error', 'error');
    } finally {
      setActing(null);
    }
  };

  // ── Summary KPIs ─────────────────────────────────────────────────────
  const criticalNeeds = needs.filter(n => n.priority <= 2);
  const totalSuggestedUnits = needs.reduce((s, n) => s + n.suggestedQuantity, 0);
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const boughtToday = requests.filter(r => r.status === 'bought');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>¿Qué debo comprar hoy?</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Reposición automática · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {stores.length > 0 && (
          <select
            value={selectedStoreId || ''}
            onChange={e => { setSelectedStoreId(Number(e.target.value)); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', fontWeight: 500, fontSize: '0.9rem' }}
          >
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* ── Summary panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <SummaryCard
          icon="🚨"
          label="Críticos"
          value={criticalNeeds.length}
          detail="Stock negativo o bajo mínimo"
          color={criticalNeeds.length > 0 ? '#dc2626' : '#10b981'}
          onClick={() => setTab('needs')}
        />
        <SummaryCard
          icon="📦"
          label="Total a comprar"
          value={`${totalSuggestedUnits} u`}
          detail={`en ${needs.length} productos`}
          color="#2563eb"
          onClick={() => setTab('needs')}
        />
        <SummaryCard
          icon="🛒"
          label="En lista"
          value={pendingRequests.length}
          detail="Pendiente de comprar"
          color={pendingRequests.length > 0 ? '#f59e0b' : '#6b7280'}
          onClick={() => setTab('requests')}
        />
        <SummaryCard
          icon="✅"
          label="Comprado hoy"
          value={boughtToday.length}
          detail="Referencias gestionadas"
          color="#10b981"
          onClick={() => setTab('requests')}
        />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', alignItems: 'center' }}>
        {(['needs', 'requests'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.625rem 1.25rem', border: 'none', cursor: 'pointer', background: 'transparent',
            fontWeight: tab === t ? 700 : 400, fontSize: '0.95rem',
            color: tab === t ? 'var(--text)' : 'var(--muted)',
            borderBottom: tab === t ? '2px solid var(--text)' : '2px solid transparent',
            marginBottom: '-2px', transition: 'all 0.15s',
          }}>
            {t === 'needs'
              ? <>Necesidades detectadas <span style={{ marginLeft: '0.375rem', padding: '1px 7px', borderRadius: '10px', fontSize: '0.75rem', background: needs.length > 0 ? '#fee2e2' : '#f3f4f6', color: needs.length > 0 ? '#991b1b' : '#6b7280', fontWeight: 700 }}>{needs.length}</span></>
              : <>Lista de compra <span style={{ marginLeft: '0.375rem', padding: '1px 7px', borderRadius: '10px', fontSize: '0.75rem', background: pendingRequests.length > 0 ? '#fef3c7' : '#f3f4f6', color: pendingRequests.length > 0 ? '#92400e' : '#6b7280', fontWeight: 700 }}>{requests.filter(r => r.status !== 'discarded').length}</span></>
            }
          </button>
        ))}
        <button onClick={loadData} style={{ marginLeft: 'auto', padding: '0.375rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.8rem' }}>
          ↻ Actualizar
        </button>
      </div>

      {/* ── TAB: NEEDS (rich cards) ── */}
      {tab === 'needs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div className="card"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
          ) : needs.length === 0 ? (
            <EmptyState
              title="Sin necesidades detectadas"
              description="El inventario está por encima de los mínimos configurados. Buen trabajo."
            />
          ) : (
            needs.map(need => (
              <NeedCard
                key={need.productId}
                need={need}
                isInList={requests.some(r => r.productId === need.productId && r.status === 'pending')}
                isAdding={addingProductIds.has(need.productId)}
                isDiscarding={discardingProductIds.has(need.productId)}
                onAdd={() => handleAddToList(need)}
                onDiscard={() => setDiscardTarget({ need, storeId: selectedStoreId! })}
              />
            ))
          )}
        </div>
      )}

      {/* ── TAB: REQUESTS (list) ── */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div className="card"><SkeletonRow /><SkeletonRow /></div>
          ) : requests.filter(r => r.status !== 'discarded').length === 0 ? (
            <EmptyState
              title="Lista de compra vacía"
              description="Añade productos desde la pestaña de necesidades para comenzar."
            />
          ) : (
            requests.filter(r => r.status !== 'discarded').map(req => {
              const meta = REASON_META[req.reason] || REASON_META.below_minimum;
              const stMeta = STATUS_META[req.status] || STATUS_META.pending;
              const isActing = acting === req.id;
              return (
                <div key={req.id} style={{
                  border: `1px solid ${req.status === 'bought' ? '#a7f3d0' : 'var(--border)'}`,
                  borderRadius: '10px',
                  background: req.status === 'bought' ? '#f0fdf4' : req.status === 'postponed' ? '#f9fafb' : 'white',
                  padding: '1rem 1.25rem',
                  opacity: req.status === 'postponed' ? 0.75 : 1,
                  display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>{meta.icon}</span>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{req.productName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.125rem' }}>
                      <span style={{ padding: '1px 7px', borderRadius: '8px', background: meta.badgeBg, color: meta.badgeColor, fontWeight: 600 }}>{meta.label}</span>
                      {req.currentStock !== undefined && <> · Stock actual: <strong>{req.currentStock}</strong></>}
                      {req.minStock > 0 && <> · Mín: <strong>{req.minStock}</strong></>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '72px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>COMPRAR</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>+{req.suggestedQuantity}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, background: stMeta.bg, color: stMeta.color }}>
                    {stMeta.label}
                  </span>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {req.status !== 'bought' && (
                      <button disabled={isActing} onClick={() => handleStatusChange(req, 'bought')} style={{ padding: '5px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                        {isActing ? '…' : '✓ Comprado'}
                      </button>
                    )}
                    {req.status === 'pending' && (
                      <button disabled={isActing} onClick={() => handleStatusChange(req, 'postponed')} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Posponer
                      </button>
                    )}
                    {req.status === 'postponed' && (
                      <button disabled={isActing} onClick={() => handleStatusChange(req, 'pending')} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Reactivar
                      </button>
                    )}
                    {req.status !== 'bought' && (
                      <button disabled={isActing} onClick={() => setDiscardTarget({ id: req.id, storeId: selectedStoreId! })} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444' }}>
                        Descartar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Discard modal */}
      {discardTarget && (
        <DiscardModal
          productName={discardTarget.need?.productName || requests.find(r => r.id === discardTarget.id)?.productName || ''}
          onConfirm={handleDiscard}
          onCancel={() => setDiscardTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Summary card helper ─────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, detail, color, onClick }: {
  icon: string; label: string; value: string | number; detail: string; color: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: '10px',
        padding: '1rem 1.25rem', cursor: onClick ? 'pointer' : 'default',
        display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
    >
      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>{detail}</div>
      </div>
    </div>
  );
}
