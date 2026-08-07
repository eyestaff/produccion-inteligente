import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryAPI, InventoryItem } from '../services/inventory';
import { CatalogAPI, Store } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { useStoreSelection } from '../ui/useStoreSelection';
import { exportToCsv } from '../utils/csv';
import { usePersistentState } from '../hooks/usePersistentState';

export function InventoryDashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useStoreSelection();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = usePersistentState('pi_inventory_search', '');

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

  const handleExportCsv = () => {
    const headers = ['ID Producto', 'Producto', 'Disponible', 'Físico', 'Reservado'];
    const rows = filteredInventory.map(item => [
      item.productId.toString(),
      item.productName,
      item.availableQuantity,
      item.quantity,
      item.reservedQuantity
    ]);
    exportToCsv('Inventario', headers, rows);
    toast('Inventario exportado a CSV', 'success');
  };

  const filteredInventory = inventory.filter(i => 
    i.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.productId.toString().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Inventario</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Control en tiempo real de existencias y niveles
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {inventory.length > 0 && (
            <button
              onClick={handleExportCsv}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              📊 Exportar CSV
            </button>
          )}
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
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Desglose por producto</h3>
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', maxWidth: '300px' }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
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
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem' }}><SkeletonRow /></td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div style={{ padding: '2rem' }}>
                      <EmptyState title="Sin resultados" description="No se encontraron productos en esta vista." />
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
