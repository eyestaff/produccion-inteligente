import { useState, useEffect } from 'react';
import { CatalogAPI, Store, BusinessLine, Product } from '../../services/catalog';
import { ProductionAPI } from '../../services/production';
import { useToast } from '../../ui/ToastProvider';

export function CreateOrderModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [lines, setLines] = useState<BusinessLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [form, setForm] = useState({
    storeId: '',
    businessLineId: '',
    productId: '',
    quantity: '',
  });

  useEffect(() => {
    Promise.all([CatalogAPI.getStores(), CatalogAPI.getBusinessLines(), CatalogAPI.getProducts()])
      .then(([s, l, p]) => {
        setStores(s || []);
        setLines(l || []);
        setProducts(p || []);
        if (s?.length) setForm((f) => ({ ...f, storeId: String(s[0].id) }));
        if (l?.length) setForm((f) => ({ ...f, businessLineId: String(l[0].id) }));
        if (p?.length) setForm((f) => ({ ...f, productId: String(p[0].id) }));
      })
      .catch(() => toast('Error cargando catálogo', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeId || !form.businessLineId || !form.productId || !form.quantity) {
      toast('Por favor, completa todos los campos', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await ProductionAPI.createOrder({
        storeId: parseInt(form.storeId),
        businessLineId: parseInt(form.businessLineId),
        items: [{ productId: parseInt(form.productId), quantity: parseInt(form.quantity) }],
      });
      toast('Orden creada con éxito', 'success');
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
        <h3 style={{ marginTop: 0 }}>Nueva Orden de Producción</h3>
        {loading ? (
          <p>Cargando maestro de productos...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
              Tienda
            </label>
            <select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
              Línea de Negocio
            </label>
            <select
              value={form.businessLineId}
              onChange={(e) => setForm({ ...form, businessLineId: e.target.value })}
            >
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
              Producto a Fabricar
            </label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
              Cantidad (Unidades)
            </label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="Ej: 500"
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
                  background: 'var(--text)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {submitting ? 'Creando...' : 'Crear Orden'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
