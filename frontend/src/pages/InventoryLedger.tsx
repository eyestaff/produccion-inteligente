import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { InventoryAPI, InventoryTransaction } from '../services/inventory';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { AdjustStockModal } from '../components/inventory/AdjustStockModal';

export function InventoryLedger() {
  const { storeId, productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // We can pass productName via state from the Dashboard
  const productName = location.state?.productName || 'Producto Desconocido';

  const loadData = async () => {
    if (!storeId || !productId) return;
    setLoading(true);
    try {
      const data = await InventoryAPI.getProductTransactions(Number(storeId), Number(productId));
      setTransactions(data || []);
    } catch (e: any) {
      toast(e.message || 'Error cargando el historial', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId, productId]);

  const getReasonLabel = (reason: string) => {
    const map: Record<string, string> = {
      production: 'Producción',
      caducity: 'Caducidad',
      breakage: 'Rotura/Merma',
      adjustment: 'Ajuste Manual',
      theft: 'Robo',
      return: 'Devolución'
    };
    return map[reason] || reason;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/inventory')} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}
        >
          ←
        </button>
        <div>
          <h2 style={{ margin: 0 }}>Historial de Movimientos</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{productName}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button 
            onClick={() => setShowModal(true)}
            style={{ padding: '0.5rem 1rem', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
          >
            Ajustar / Registrar Merma
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState 
            title="Sin movimientos" 
            description="No hay transacciones registradas para este producto." 
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--panel-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Fecha</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Tipo</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Razón</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Cantidad</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Módulo</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                      background: t.type === 'in' ? '#d1fae5' : t.type === 'out' ? '#fee2e2' : '#fef3c7',
                      color: t.type === 'in' ? '#065f46' : t.type === 'out' ? '#991b1b' : '#92400e'
                    }}>
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{getReasonLabel(t.reason)}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: t.quantityChange > 0 ? '#10b981' : t.quantityChange < 0 ? '#ef4444' : 'inherit' }}>
                    {t.quantityChange > 0 ? `+${t.quantityChange}` : t.quantityChange}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {t.sourceModule}
                    {t.referenceType && ` (${t.referenceType} #${t.referenceId})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && storeId && productId && (
        <AdjustStockModal 
          storeId={Number(storeId)} 
          productId={Number(productId)} 
          productName={productName}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
