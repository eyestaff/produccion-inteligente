import { useEffect, useState } from 'react';
import { ForecastAPI, ForecastDashboardResult, ForecastRecommendation, ForecastRisk, ForecastHistoryItem } from '../services/forecast';
import { CatalogAPI, Store } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { useStoreSelection } from '../ui/useStoreSelection';

const CONFIDENCE_COLORS = {
  High: { bg: '#dcfce7', text: '#166534', label: 'Alta' },
  Medium: { bg: '#fef9c3', text: '#854d0e', label: 'Media' },
  Low: { bg: '#fee2e2', text: '#991b1b', label: 'Baja' },
};

function RecommendationCard({ 
  rec, 
  adjustedQuantity, 
  onAdjust 
}: { 
  rec: ForecastRecommendation, 
  adjustedQuantity: number, 
  onAdjust: (val: number) => void 
}) {
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
        style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{rec.productName}</span>
            {(rec as any).isAiAdjusted && (
              <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#3730a3', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>🤖</span> IA
              </span>
            )}
            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: conf.bg, color: conf.text }}>
              Confianza {conf.label}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            Sugerido: <strong>{rec.suggestedQuantity}</strong> (Base: {rec.metrics.consumption30d > 0 ? (rec.metrics.consumption30d/30).toFixed(1) : 0}/día)
          </div>
        </div>
        
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            {typeLabel} (Ajuste)
          </label>
          <input 
            type="number" 
            min="0"
            value={adjustedQuantity}
            onChange={(e) => onAdjust(Number(e.target.value))}
            style={{
              width: '80px',
              padding: '0.5rem',
              borderRadius: '6px',
              border: `2px solid ${typeColor}`,
              fontSize: '1.1rem',
              fontWeight: 700,
              textAlign: 'center'
            }}
          />
        </div>
        
        <div style={{ color: 'var(--muted)', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text)', textTransform: 'uppercase' }}>
            ¿Por qué el sistema sugiere {rec.suggestedQuantity}? (Datos históricos)
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {rec.reasons.map((r, i) => (
              <li key={i} style={{ 
                fontWeight: r.startsWith('🤖') ? 600 : 400,
                color: r.startsWith('🤖') ? '#3730a3' : 'inherit'
              }}>
                {r}
              </li>
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
  const [selectedStoreId, setSelectedStoreId] = useStoreSelection();
  
  const [data, setData] = useState<ForecastDashboardResult | null>(null);
  const [history, setHistory] = useState<ForecastHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for adjustments
  const [adjustments, setAdjustments] = useState<Record<number, number>>({});
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    CatalogAPI.getStores().then(s => {
      setStores(s || []);
      if (s && s.length > 0 && !selectedStoreId) setSelectedStoreId(s[0].id);
      else if (s && s.length === 0) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadData();
      loadHistory();
    }
  }, [selectedStoreId]);

  const loadData = async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    try {
      const res = await ForecastAPI.getDashboard(selectedStoreId);
      setData(res);
      // Initialize adjustments with suggested quantities
      const initialAdj: Record<number, number> = {};
      res.recommendations.forEach(r => {
        initialAdj[r.productId] = r.suggestedQuantity;
      });
      setAdjustments(initialAdj);
    } catch (e: any) {
      toast(e.message || 'Error cargando forecast', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedStoreId) return;
    try {
      const hist = await ForecastAPI.getHistory(selectedStoreId);
      setHistory(hist);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleAdjust = (productId: number, val: number) => {
    setAdjustments(prev => ({ ...prev, [productId]: val }));
  };

  const handleApprove = async () => {
    if (!selectedStoreId || !data) return;
    setIsApproving(true);
    try {
      const targetDate = new Date().toISOString().split('T')[0];
      const itemsPayload = data.recommendations.map(r => ({
        productId: r.productId,
        type: r.type,
        historicalBase: r.metrics.consumption30d > 0 ? r.metrics.consumption30d / 30 : 0,
        suggestedQuantity: r.suggestedQuantity,
        adjustedQuantity: adjustments[r.productId] || 0
      }));

      await ForecastAPI.approvePlan(selectedStoreId, targetDate, itemsPayload);
      toast('Plan aprobado y Órdenes de Producción generadas.', 'success');
      loadData();
      loadHistory();
    } catch (e: any) {
      toast(e.message || 'Error aprobando plan', 'error');
    } finally {
      setIsApproving(false);
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
    <div className="content animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <p className="eyebrow">Inteligencia Artificial</p>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Forecast & S&OP 
            <span style={{ fontSize: '0.9rem', padding: '3px 8px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#3730a3', borderRadius: '12px', fontWeight: 600 }}>
              Smart Protocol v1
            </span>
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Predicciones basadas en ventas y consumo real de los últimos 30 días.
          </p>
        </div>
        <div className="flex-end gap-2">
          {stores.length > 0 && (
            <select
              value={selectedStoreId || ''}
              onChange={e => setSelectedStoreId(Number(e.target.value))}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', fontWeight: 500 }}
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button 
            onClick={handleApprove}
            disabled={isApproving || data.recommendations.length === 0}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              cursor: isApproving ? 'not-allowed' : 'pointer',
              opacity: isApproving ? 0.7 : 1
            }}
          >
            {isApproving ? 'Aprobando...' : 'Aprobar Plan y Generar Órdenes'}
          </button>
        </div>
      </div>

      {/* Riesgos Alert */}
      {data.risks.length > 0 && (
        <div className="card animate-in animate-delay-1" style={{ borderLeft: '4px solid #ef4444' }}>
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
            produceRecs.map(r => (
              <RecommendationCard 
                key={r.productId} 
                rec={r} 
                adjustedQuantity={adjustments[r.productId] ?? r.suggestedQuantity} 
                onAdjust={(val) => handleAdjust(r.productId, val)}
              />
            ))
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
            buyRecs.map(r => (
              <RecommendationCard 
                key={r.productId} 
                rec={r} 
                adjustedQuantity={adjustments[r.productId] ?? r.suggestedQuantity} 
                onAdjust={(val) => handleAdjust(r.productId, val)}
              />
            ))
          )}
        </div>

      </div>

      {/* Histórico y Desviaciones */}
      {history.length > 0 && (
        <div className="card animate-in animate-delay-2" style={{ padding: 0, overflow: 'hidden', marginTop: '2rem' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.1rem' }}>Histórico de Previsiones (Desviaciones)</h3>
          </div>
          <div className="table-responsive">
            <div style={{ overflowX: "auto" }}><table>
              <thead>
                <tr>
                  <th>Fecha Objetivo</th>
                  <th>Producto</th>
                  <th className="text-right">Sugerido</th>
                  <th className="text-right">Aprobado</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{h.targetDate}</td>
                    <td style={{ fontWeight: 600 }}>{h.productName}</td>
                    <td className="text-right" style={{ color: 'var(--muted)' }}>{Number(h.suggestedQuantity).toFixed(2)}</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{Number(h.adjustedQuantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

    </div>
  );
}
