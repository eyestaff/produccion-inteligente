import { useState, useEffect } from 'react';
import { wasteService, type WasteReason } from '../../services/waste';
import { CatalogAPI, Product } from '../../services/catalog';
import { useToast } from '../../ui/ToastProvider';

interface NewWasteModalProps {
  storeId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewWasteModal({ storeId, isOpen, onClose, onSuccess }: NewWasteModalProps) {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<WasteReason | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoadingProducts(true);
      CatalogAPI.getProducts()
        .then(p => setProducts(p || []))
        .catch(() => toast('Error cargando productos', 'error'))
        .finally(() => setLoadingProducts(false));
      
      // Reset form
      setProductId('');
      setQuantity('');
      setReason('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !reason) {
      toast('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await wasteService.registerWaste(storeId, {
        productId: Number(productId),
        quantity: Number(quantity),
        reason: reason as WasteReason,
        notes: notes || undefined
      });
      toast('Merma registrada exitosamente', 'success');
      onSuccess();
      onClose();
    } catch (e: any) {
      toast(e.message || 'Error registrando merma', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--panel)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Registrar Merma</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Producto *</label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              disabled={loadingProducts || submitting}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
            >
              <option value="">Selecciona un producto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Cantidad *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={submitting}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Motivo *</label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value as WasteReason)}
                disabled={submitting}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <option value="">Seleccionar motivo</option>
                <option value="caducity">Caducidad</option>
                <option value="overproduction">Exceso de producción</option>
                <option value="error">Error en producción</option>
                <option value="breakage">Rotura / Daño</option>
                <option value="quality">Control de calidad</option>
                <option value="other">Otros</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Notas / Detalles adicionales</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={3}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', resize: 'vertical' }}
              placeholder="Opcional..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 500 }}
            >
              {submitting ? 'Registrando...' : 'Registrar Merma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
