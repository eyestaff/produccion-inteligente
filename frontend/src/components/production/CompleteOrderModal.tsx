import { useState } from 'react';
import { ProductionAPI } from '../../services/production';
import { useToast } from '../../ui/ToastProvider';

export function CompleteOrderModal({
  order,
  onClose,
  onSuccess,
}: {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [actualQuantity, setActualQuantity] = useState(order.targetQuantity.toString());
  const [wasteQuantity, setWasteQuantity] = useState('0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ProductionAPI.completeOrder(
        order.id,
        parseInt(actualQuantity),
        parseInt(wasteQuantity),
      );
      toast('Producción completada y stock actualizado', 'success');
      onSuccess();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 style={{ marginTop: 0 }}>Completar Orden ORD-{order.id.toString().padStart(4, '0')}</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
          Verifica las cantidades reales antes de enviar. El inventario se actualizará
          automáticamente.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>Objetivo Planificado:</p>
            <strong style={{ fontSize: '1.2rem', color: 'var(--text)' }}>
              {order.targetQuantity} unidades
            </strong>
          </div>

          <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
            Cantidad Lograda (Real)
          </label>
          <input
            type="number"
            min="0"
            value={actualQuantity}
            onChange={(e) => setActualQuantity(e.target.value)}
            required
            style={{
              width: '100%',
              marginBottom: '1rem',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--border)',
            }}
          />

          <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
            Mermas (Unidades desechadas)
          </label>
          <input
            type="number"
            min="0"
            value={wasteQuantity}
            onChange={(e) => setWasteQuantity(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--border)',
            }}
          />
          <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
            Los ingredientes para estas mermas igual se descontarán del almacén.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {submitting ? 'Guardando...' : 'Confirmar Cierre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
