import { useEffect, useState } from 'react';
import { wasteService, WasteMetrics, WasteRecord } from '../services/waste';
import { CatalogAPI, Store } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { useStoreSelection } from '../ui/useStoreSelection';
import { NewWasteModal } from '../components/waste/NewWasteModal';
import { exportToCsv } from '../utils/csv';

export function WasteDashboard() {
  const toast = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useStoreSelection();
  
  const [metrics, setMetrics] = useState<WasteMetrics | null>(null);
  const [history, setHistory] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async (storeId: number) => {
    setLoading(true);
    try {
      const [m, h] = await Promise.all([
        wasteService.getMetrics(storeId),
        wasteService.listWaste(storeId)
      ]);
      setMetrics(m);
      setHistory(h || []);
    } catch (e: any) {
      toast(e.message || 'Error cargando datos de mermas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    CatalogAPI.getStores()
      .then(s => {
        setStores(s || []);
        if (s && s.length > 0 && !selectedStoreId) {
          setSelectedStoreId(s[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        toast('Error cargando tiendas', 'error');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadData(selectedStoreId);
    }
  }, [selectedStoreId]);

  const handleExportCsv = () => {
    const headers = ['Fecha', 'Producto', 'Cantidad', 'Motivo', 'Usuario', 'Notas'];
    const rows = history.map(item => [
      new Date(item.createdAt).toLocaleString(),
      item.productName,
      item.quantity.toString(),
      item.reason,
      item.userEmail || item.createdBy.toString(),
      item.notes || ''
    ]);
    exportToCsv('Historial_Mermas', headers, rows);
    toast('Historial exportado a CSV', 'success');
  };

  const getReasonLabel = (r: string) => {
    const m: Record<string, string> = {
      caducity: 'Caducidad',
      overproduction: 'Exceso producción',
      error: 'Error',
      breakage: 'Rotura',
      quality: 'Calidad',
      theft: 'Robo',
      other: 'Otros'
    };
    return m[r] || r;
  };

  return (
    <div className="content animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex-between">
        <div>
          <p className="eyebrow">Gestión Operativa</p>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Mermas y Desperdicios
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Control y análisis de impacto económico
          </p>
        </div>
        <div className="flex-end gap-2">
          {stores.length > 0 && (
            <select 
              value={selectedStoreId || ''} 
              onChange={(e) => setSelectedStoreId(Number(e.target.value))}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', fontWeight: 500 }}
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedStoreId}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
          >
            + Registrar Merma
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Cargando datos...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-grid animate-in animate-delay-1">
            <article className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <span className="kpi-label">Merma Hoy</span>
              <strong className="kpi-value" style={{ color: '#ef4444' }}>{metrics?.dailyWaste || 0}</strong>
              <p className="kpi-detail">unidades perdidas</p>
            </article>
            
            <article className="kpi-card">
              <span className="kpi-label">Semana Actual</span>
              <strong className="kpi-value">{metrics?.weeklyWaste || 0}</strong>
              <p className="kpi-detail">unidades en 7 días</p>
            </article>

            <article className="kpi-card">
              <span className="kpi-label">Top Producto (30d)</span>
              <strong className="kpi-value" style={{ fontSize: '1.5rem' }}>{metrics?.topProduct || '-'}</strong>
              <p className="kpi-detail" style={{ color: '#ef4444' }}>{metrics?.topProductWaste || 0} unidades mermadas</p>
            </article>

            <article className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="kpi-label">Coste Estimado (7d)</span>
              <strong className="kpi-value" style={{ color: '#f59e0b' }}>${(metrics?.estimatedCost || 0).toFixed(2)}</strong>
              <p className="kpi-detail">impacto teórico</p>
            </article>
          </div>

          {/* History */}
          <div className="card animate-in animate-delay-2" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Historial Reciente</h3>
              <button 
                onClick={handleExportCsv}
                disabled={history.length === 0}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Exportar CSV
              </button>
            </div>
            
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th className="text-center">Motivo</th>
                    <th>Usuario</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                        No hay registros de mermas recientes.
                      </td>
                    </tr>
                  ) : (
                    history.map(row => (
                      <tr key={row.id}>
                        <td>
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {row.productName}
                        </td>
                        <td style={{ color: '#ef4444', fontWeight: 600 }}>
                          {row.quantity}
                        </td>
                        <td className="text-center">
                          <span className="badge" style={{ background: 'var(--panel-muted)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                            {getReasonLabel(row.reason)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>
                          {row.userEmail || `ID: ${row.createdBy}`}
                        </td>
                        <td style={{ color: 'var(--muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedStoreId && (
        <NewWasteModal
          storeId={selectedStoreId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => loadData(selectedStoreId)}
        />
      )}
    </div>
  );
}
