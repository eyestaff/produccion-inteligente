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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Waste Management</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Control y análisis de mermas y desperdicios
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 500, cursor: 'pointer' }}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Merma Hoy</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{metrics?.dailyWaste || 0}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem' }}>unidades perdidas</div>
            </div>
            
            <div style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semana Actual</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics?.weeklyWaste || 0}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem' }}>unidades en 7 días</div>
            </div>

            <div style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Producto (30d)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem' }}>{metrics?.topProduct || '-'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: '0.5rem', fontWeight: 500 }}>{metrics?.topProductWaste || 0} unidades mermadas</div>
            </div>

            <div style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coste Estimado (7d)</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>${(metrics?.estimatedCost || 0).toFixed(2)}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem' }}>impacto teórico</div>
            </div>
          </div>

          {/* History */}
          <div style={{ background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Historial Reciente</h3>
              <button 
                onClick={handleExportCsv}
                disabled={history.length === 0}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: history.length > 0 ? 'pointer' : 'not-allowed', color: 'var(--text)' }}
              >
                Exportar CSV
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.85rem' }}>FECHA</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.85rem' }}>PRODUCTO</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.85rem' }}>CANTIDAD</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.85rem' }}>MOTIVO</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.85rem' }}>USUARIO</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.85rem' }}>NOTAS</th>
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
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                          {row.productName}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--danger)', fontWeight: 600 }}>
                          {row.quantity}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ 
                            background: 'var(--bg)', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem',
                            color: 'var(--muted)'
                          }}>
                            {getReasonLabel(row.reason)}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                          {row.userEmail || `ID: ${row.createdBy}`}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
