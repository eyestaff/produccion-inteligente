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
    <div className="content animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div className="flex-between">
        <div>
          <p className="eyebrow">Gestión de Stock</p>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Inventario</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Control en tiempo real de existencias y niveles
          </p>
        </div>
        <div className="flex-end gap-2">
          {inventory.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Exportar CSV
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
      <div className="kpi-grid animate-in animate-delay-1">
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
      <div className="card animate-in animate-delay-2" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex-between" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Desglose por producto</h3>
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', width: '100%', maxWidth: '300px', outline: 'none', background: 'var(--panel)' }}
          />
        </div>
        <div className="table-responsive">
          <div style={{ overflowX: "auto" }}><table>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-right">Físico Total</th>
                <th className="text-right">Reservado</th>
                <th className="text-right">Disponible</th>
                <th className="text-center">Acciones</th>
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
                  <tr key={item.productId}>
                    <td style={{ fontWeight: 600 }}>{item.productName}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right" style={{ color: '#f59e0b', fontWeight: 600 }}>{item.reservedQuantity}</td>
                    <td className="text-right" style={{ fontWeight: 700, color: item.availableQuantity <= 0 ? '#ef4444' : 'inherit' }}>{item.availableQuantity}</td>
                    <td className="text-center">
                      <button 
                        onClick={() => navigate(`/inventory/${selectedStoreId}/product/${item.productId}`, { state: { productName: item.productName } })}
                        className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </div>
      </div>

    </div>
  );
}
