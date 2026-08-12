import { useState } from 'react';
import { InventoryAPI, AdjustReason } from '../../services/inventory';
import { useToast } from '../../ui/ToastProvider';

export function AdjustStockModal({
  storeId,
  productId,
  productName,
  onClose,
  onSuccess,
}: {
  storeId: number;
  productId: number;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    quantity: '',
    reason: 'breakage' as AdjustReason,
    isNegative: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) === 0) {
      toast('Por favor, ingresa una cantidad válida', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const qty = Number(form.quantity) * (form.isNegative ? -1 : 1);
      await InventoryAPI.adjustInventory(storeId, productId, qty, form.reason);
      toast('Ajuste registrado con éxito', 'success');
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
        <h3 style={{ marginTop: 0 }}>Ajuste de Inventario</h3>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>{productName}</p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
            Tipo de Ajuste
          </label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <input
                type="radio"
                checked={form.isNegative}
                onChange={() => setForm({ ...form, isNegative: true, reason: 'breakage' })}
              />{' '}
              Salida / Merma
            </label>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <input
                type="radio"
                checked={!form.isNegative}
                onChange={() => setForm({ ...form, isNegative: false, reason: 'adjustment' })}
              />{' '}
              Entrada / Corrección
            </label>
          </div>

          <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
            Razón del Ajuste
          </label>
          <select
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value as AdjustReason })}
          >
            {form.isNegative ? (
              <>
                <option value="breakage">Rotura / Merma</option>
                <option value="caducity">Caducidad</option>
                <option value="theft">Pérdida / Robo</option>
                <option value="adjustment">Ajuste de Inventario (Salida)</option>
              </>
            ) : (
              <>
                <option value="adjustment">Ajuste de Inventario (Entrada)</option>
                <option value="return">Devolución</option>
              </>
            )}
          </select>

          <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
            Cantidad (Unidades/Kg)
          </label>
          <input
            type="number"
            min="1"
            step="any"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Ej: 5"
          />

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
                background: form.isNegative ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {submitting ? 'Registrando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
