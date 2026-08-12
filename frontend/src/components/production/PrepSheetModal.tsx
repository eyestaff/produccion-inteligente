import { useEffect, useState } from 'react';
import { ProductionAPI, PrepSheet } from '../../services/production';
import { useToast } from '../../ui/ToastProvider';
import { SkeletonRow } from '../../ui/Skeleton';
import { Printer } from 'lucide-react';

export function PrepSheetModal({ order, onClose }: { order: any; onClose: () => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<PrepSheet | null>(null);

  useEffect(() => {
    ProductionAPI.getPrepSheet(order.id)
      .then((s) => setSheet(s))
      .catch((e) => toast(e.message || 'Error cargando hoja de preparación', 'error'))
      .finally(() => setLoading(false));
  }, [order.id]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ margin: 0 }}>
            Hoja de Preparación (ORD-{order.id.toString().padStart(4, '0')})
          </h3>
          <button
            onClick={() => window.print()}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>

        {loading ? (
          <div>
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : !sheet ? (
          <p>No se pudo cargar la información.</p>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Objetivo</span>
                <div style={{ fontWeight: 500 }}>{order.targetQuantity} uds</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Tienda</span>
                <div style={{ fontWeight: 500 }}>
                  {order.storeName || 'Tienda #' + order.storeId}
                </div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 0.5rem' }}>Ingredientes Requeridos (Explosión)</h4>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                marginBottom: '1.5rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.5rem 0' }}>Ingrediente</th>
                  <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {sheet.ingredients.map((ing) => (
                  <tr key={ing.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem 0', fontWeight: 500 }}>{ing.productName}</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                      {ing.quantity} {ing.unit}
                    </td>
                  </tr>
                ))}
                {sheet.ingredients.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: '1rem 0', color: 'var(--muted)' }}>
                      Esta orden no requiere ingredientes o no hay receta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--text)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
