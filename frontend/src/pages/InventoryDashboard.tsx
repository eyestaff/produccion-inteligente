import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryAPI, InventoryItem } from '../services/inventory';
import { CatalogAPI, Store } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

export function InventoryDashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CatalogAPI.getStores()
      .then(s => {
        setStores(s || []);
        if (s && s.length > 0) {
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
    if (!selectedStoreId) return;
    setLoading(true);
    InventoryAPI.getStoreInventory(selectedStoreId)
      .then(data => {
        setInventory(data || []);
      })
      .catch(e => toast(e.message || 'Error cargando inventario', 'error'))
      .finally(() => setLoading(false));
  }, [selectedStoreId]);

  const kpis = {
    totalItems: inventory.length,
    lowStock: inventory.filter(i => i.availableQuantity <= 0).length,
    totalReserved: inventory.reduce((acc, curr) => acc + curr.reservedQuantity, 0)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Store Selector Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Gestión de Inventario</h2>
        {stores.length > 0 && (
          <select 
            value={selectedStoreId || ''} 
            onChange={(e) => setSelectedStoreId(Number(e.target.value))}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', fontWeight: 500 }}
          >
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-label">Total Referencias</span>
          <strong className="kpi-value">{kpis.totalItems}</strong>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Stock Crítico / Cero</span>
          <strong className="kpi-value" style={{ color: kpis.lowStock > 0 ? '#ef4444' : 'inherit' }}>{kpis.lowStock}</strong>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Unidades Reservadas</span>
          <strong className="kpi-value" style={{ color: '#f59e0b' }}>{kpis.totalReserved}</strong>
        </article>
      </div>

      {/* Inventory List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : inventory.length === 0 ? (
          <EmptyState 
            title="Inventario vacío" 
            description="Esta tienda no tiene movimientos registrados de productos aún." 
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--panel-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Producto</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Físico Total</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Reservado</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Disponible</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{item.productName}</td>
                  <td style={{ padding: '1rem' }}>{item.quantity}</td>
                  <td style={{ padding: '1rem', color: '#f59e0b' }}>{item.reservedQuantity}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: item.availableQuantity <= 0 ? '#ef4444' : 'inherit' }}>{item.availableQuantity}</td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => navigate(`/inventory/${selectedStoreId}/product/${item.productId}`, { state: { productName: item.productName } })}
                      style={{ cursor: 'pointer', padding: '4px 8px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
