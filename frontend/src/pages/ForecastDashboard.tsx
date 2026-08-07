import { useEffect, useState } from 'react';
import { ForecastAPI, ForecastDashboardResult, ForecastRecommendation, ForecastRisk } from '../services/forecast';
import { CatalogAPI, Store } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

// ── Helpers ────────────────────────────────────────────────────────────────
const CONFIDENCE_COLORS = {
  High: { bg: '#d1fae5', text: '#065f46', label: 'Alta' },
  Medium: { bg: '#fef3c7', text: '#92400e', label: 'Media' },
  Low: { bg: '#fee2e2', text: '#991b1b', label: 'Baja' },
};

function RecommendationCard({ rec }: { rec: ForecastRecommendation }) {
  const [expanded, setExpanded] = useState(false);
  const conf = CONFIDENCE_COLORS[rec.confidence];
  const typeLabel = rec.type === 'produce' ? 'Fabricar' : 'Comprar';
  const typeColor = rec.type === 'produce' ? '#2563eb' : '#059669';

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '10px',
      background: 'white',
      overflow: 'hidden',
      marginBottom: '0.75rem',
      transition: 'box-shadow 0.2s',
    }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{rec.productName}</span>
            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: conf.bg, color: conf.text }}>
              Confianza {conf.label}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', paddingRight: '1rem', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            {typeLabel} sugerido
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: typeColor }}>
            {rec.suggestedQuantity}
          </div>
        </div>
        <div style={{ color: 'var(--muted)' }}>{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text)', textTransform: 'uppercase' }}>
            ¿Por qué el sistema sugiere esto? (Datos históricos)
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {rec.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RiskCard({ risk }: { risk: ForecastRisk }) {
  const isHigh = risk.severity === 'high';
  return (
    <div style={{
      borderLeft: `4px solid ${isHigh ? '#ef4444' : '#f59e0b'}`,
      background: isHigh ? '#fef2f2' : '#fffbeb',
      padding: '1rem',
      borderRadius: '0 8px 8px 0',
      marginBottom: '0.5rem',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-start'
    }}>
      <span style={{ fontSize: '1.25rem' }}>{isHigh ? '🚨' : '⚠️'}</span>
      <div>
        <div style={{ fontWeight: 700, color: isHigh ? '#991b1b' : '#92400e', marginBottom: '0.25rem' }}>
          {risk.productName}
        </div>
        <div style={{ fontSize: '0.9rem', color: isHigh ? '#b91c1c' : '#b45309' }}>
          {risk.message}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export function ForecastDashboard() {
  const toast = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  const [data, setData] = useState<ForecastDashboardResult | null>(null);
  const [loading, setLoading] = useState(true);

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
      const res = await ForecastAPI.getDashboard(selectedStoreId);
      setData(res);
    } catch (e: any) {
      toast(e.message || 'Error cargando forecast', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Procesando histórico... 🔮</h2>
        <SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    );
  }

  if (!data) return <EmptyState title="Sin datos" description="No se pudo generar el forecast." />;

  const produceRecs = data.recommendations.filter(r => r.type === 'produce');
  const buyRecs = data.recommendations.filter(r => r.type === 'buy');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Forecast <span style={{ fontSize: '0.9rem', padding: '3px 8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '12px', fontWeight: 600 }}>v1.0 (Histórico)</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Predicciones basadas 100% en el consumo real de los últimos 30 días.
          </p>
        </div>
        {stores.length > 0 && (
          <select
            value={selectedStoreId || ''}
            onChange={e => setSelectedStoreId(Number(e.target.value))}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', fontWeight: 500 }}
          >
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* Riesgos Alert */}
      {data.risks.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#111827' }}>Riesgos Detectados</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {data.risks.map((risk, i) => <RiskCard key={i} risk={risk} />)}
          </div>
        </div>
      )}

      {/* Grid: Producción vs Compras */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Producción */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a', marginBottom: '1rem' }}>
            🏭 ¿Qué debo fabricar hoy?
          </h3>
          {produceRecs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
              No hay necesidades de producción urgentes detectadas por el forecast.
            </div>
          ) : (
            produceRecs.map(r => <RecommendationCard key={r.productId} rec={r} />)
          )}
        </div>

        {/* Compras */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', marginBottom: '1rem' }}>
            🛒 ¿Qué debo reponer hoy?
          </h3>
          {buyRecs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
              El inventario de materias primas y productos comprados parece estar sano.
            </div>
          ) : (
            buyRecs.map(r => <RecommendationCard key={r.productId} rec={r} />)
          )}
        </div>

      </div>

      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--muted)' }}>
        Último cálculo: {new Date(data.updatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
