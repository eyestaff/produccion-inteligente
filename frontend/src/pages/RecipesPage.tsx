import { useState, useEffect, useCallback } from 'react';
import { RecipesAPI, Recipe, RecipeDetail, RecipeItem } from '../services/recipes';
import { CatalogAPI, Product } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';
import { SkeletonRow } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

// ─── Constants ───────────────────────────────────────────────────────────────

const UNITS = ['u', 'kg', 'g', 'l', 'ml', 'cL', 'mg'];

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Activa', bg: '#d1fae5', color: '#065f46' },
  draft: { label: 'Borrador', bg: '#fef3c7', color: '#92400e' },
  inactive: { label: 'Inactiva', bg: '#f3f4f6', color: '#6b7280' },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: meta.bg,
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
}

// ─── Ingredient Row (inside detail / edit modal) ──────────────────────────────

interface IngredientRowProps {
  item: RecipeItem;
  onRemove: (itemId: number) => void;
  removing: boolean;
}

function IngredientRow({ item, onRemove, removing }: IngredientRowProps) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>{item.productName}</td>
      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>{item.quantity}</td>
      <td style={{ padding: '0.6rem 0.5rem' }}>{item.unit}</td>
      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
        <button
          onClick={() => onRemove(item.id)}
          disabled={removing}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc2626',
            cursor: removing ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: removing ? 0.5 : 1,
          }}
          title="Eliminar ingrediente"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// ─── Add Ingredient Form (inside detail panel) ────────────────────────────────

interface AddIngredientFormProps {
  recipeId: number;
  products: Product[];
  onAdded: () => void;
}

function AddIngredientForm({ recipeId, products, onAdded }: AddIngredientFormProps) {
  const toast = useToast();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!productId) {
      toast('Selecciona un ingrediente', 'error');
      return;
    }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      toast('La cantidad debe ser mayor que cero', 'error');
      return;
    }

    try {
      setSaving(true);
      await RecipesAPI.addItem(recipeId, {
        productId: parseInt(productId, 10),
        quantity: qty,
        unit,
      });
      toast('Ingrediente añadido', 'success');
      setProductId('');
      setQuantity('');
      setUnit('kg');
      onAdded();
    } catch (err: any) {
      toast(err.message || 'Error al añadir ingrediente', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleAdd}
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr auto',
        gap: '0.5rem',
        alignItems: 'end',
        marginTop: '1rem',
        padding: '1rem',
        background: 'var(--panel-muted)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>
          Ingrediente *
        </label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'white',
          }}
        >
          <option value="">— Seleccionar —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.baseUnit})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>
          Cantidad *
        </label>
        <input
          type="number"
          step="0.001"
          min="0.001"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>
          Unidad *
        </label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'white',
          }}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        style={{
          padding: '0.5rem 1rem',
          background: saving ? '#93c5fd' : 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: saving ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {saving ? '…' : '+ Añadir'}
      </button>
    </form>
  );
}

// ─── Recipe Detail / Edit Modal ───────────────────────────────────────────────

interface RecipeDetailModalProps {
  recipe: Recipe;
  products: Product[];
  onClose: () => void;
  onUpdated: () => void;
}

function RecipeDetailModal({ recipe, products, onClose, onUpdated }: RecipeDetailModalProps) {
  const toast = useToast();
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Edit header fields
  const [editName, setEditName] = useState(recipe.name);
  const [editYield, setEditYield] = useState(recipe.yieldQuantity.toString());
  const [editStatus, setEditStatus] = useState(recipe.status);
  const [savingHeader, setSavingHeader] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const d = await RecipesAPI.get(recipe.id);
      setDetail(d);
    } catch (err: any) {
      toast(err.message || 'Error cargando receta', 'error');
    } finally {
      setLoading(false);
    }
  }, [recipe.id, toast]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const yieldQty = parseFloat(editYield);
    if (!editName.trim()) {
      toast('El nombre de la receta es obligatorio', 'error');
      return;
    }
    if (!yieldQty || yieldQty <= 0) {
      toast('El rendimiento debe ser mayor que cero', 'error');
      return;
    }

    try {
      setSavingHeader(true);
      await RecipesAPI.update(recipe.id, {
        name: editName.trim(),
        yieldQuantity: yieldQty,
        status: editStatus,
      });
      toast('Receta actualizada', 'success');
      onUpdated();
      loadDetail();
    } catch (err: any) {
      toast(err.message || 'Error al actualizar receta', 'error');
    } finally {
      setSavingHeader(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!detail) return;
    if (detail.items.length <= 1) {
      toast('Una receta debe tener al menos un ingrediente', 'error');
      return;
    }
    try {
      setRemovingId(itemId);
      await RecipesAPI.removeItem(recipe.id, itemId);
      toast('Ingrediente eliminado', 'success');
      loadDetail();
    } catch (err: any) {
      toast(err.message || 'Error al eliminar ingrediente', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  // Compute estimated cost from items and product costs
  const estimatedCost = detail
    ? detail.items.reduce((acc, item) => {
        const prod = products.find((p) => p.id === item.productId);
        return acc + (prod?.cost ?? 0) * item.quantity;
      }, 0)
    : 0;

  const finishedProduct = products.find((p) => p.id === recipe.productId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Editar Receta
            </p>
            <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.25rem' }}>
              {finishedProduct?.name ?? `Producto #${recipe.productId}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--muted)',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Edit Header Form */}
          <form onSubmit={handleSaveHeader}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre de la receta *</label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rendimiento *</label>
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={editYield}
                  onChange={(e) => setEditYield(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Estado</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'white',
                  }}
                >
                  <option value="draft">Borrador</option>
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={savingHeader}
                className="btn-primary"
                style={{ opacity: savingHeader ? 0.7 : 1 }}
              >
                {savingHeader ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>

          {/* Ingredients Section */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Ingredientes (BOM)</h3>
              {detail && (
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Coste estimado:{' '}
                  <strong style={{ color: 'var(--text)' }}>€{estimatedCost.toFixed(2)}</strong> /{' '}
                  {detail.yieldQuantity} uds → €{(estimatedCost / detail.yieldQuantity).toFixed(4)}
                  /ud
                </span>
              )}
            </div>

            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : !detail || detail.items.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                Sin ingredientes. Añade al menos uno.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '2px solid var(--border)',
                        textAlign: 'left',
                        color: 'var(--muted)',
                      }}
                    >
                      <th style={{ padding: '0.5rem' }}>Ingrediente</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cantidad</th>
                      <th style={{ padding: '0.5rem' }}>Unidad</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', width: '48px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <IngredientRow
                        key={item.id}
                        item={item}
                        onRemove={handleRemoveItem}
                        removing={removingId === item.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Ingredient */}
            <AddIngredientForm recipeId={recipe.id} products={products} onAdded={loadDetail} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Recipe Modal ──────────────────────────────────────────────────────

interface CreateRecipeModalProps {
  products: Product[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateRecipeModal({ products, onClose, onCreated }: CreateRecipeModalProps) {
  const toast = useToast();

  // Step 1: recipe header
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [yieldQty, setYieldQty] = useState('1');

  // Step 2: ingredients
  const [createdRecipeId, setCreatedRecipeId] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<
    { productId: string; quantity: string; unit: string }[]
  >([{ productId: '', quantity: '', unit: 'kg' }]);

  const [saving, setSaving] = useState(false);

  // Auto-fill name from selected product
  const handleProductChange = (id: string) => {
    setProductId(id);
    const prod = products.find((p) => p.id.toString() === id);
    if (prod && !name) {
      setName(`Receta ${prod.name}`);
    }
  };

  const addIngredientLine = () => {
    setIngredients((prev) => [...prev, { productId: '', quantity: '', unit: 'kg' }]);
  };

  const removeIngredientLine = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredientLine = (
    index: number,
    field: 'productId' | 'quantity' | 'unit',
    value: string,
  ) => {
    setIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const validate = (): string | null => {
    if (!productId) return 'Selecciona un producto terminado';
    if (!name.trim()) return 'El nombre de la receta es obligatorio';
    const yld = parseFloat(yieldQty);
    if (!yld || yld <= 0) return 'El rendimiento debe ser mayor que cero';
    if (ingredients.length === 0) return 'Añade al menos un ingrediente';
    for (const row of ingredients) {
      if (!row.productId) return 'Todos los ingredientes deben tener un producto seleccionado';
      const qty = parseFloat(row.quantity);
      if (!qty || qty <= 0) return 'Todas las cantidades deben ser mayores que cero';
      if (!row.unit) return 'Todas las unidades son obligatorias';
    }
    // Circular BOM: ingredient cannot be the same as the finished product
    const circularItem = ingredients.find((row) => row.productId === productId);
    if (circularItem)
      return 'Un ingrediente no puede ser el mismo producto terminado (BOM circular)';
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast(error, 'error');
      return;
    }

    try {
      setSaving(true);

      // 1. Create recipe header
      const recipe = await RecipesAPI.create({
        productId: parseInt(productId, 10),
        name: name.trim(),
        yieldQuantity: parseFloat(yieldQty),
        status: 'active',
      });

      setCreatedRecipeId(recipe.id);

      // 2. Create all ingredient items in parallel
      await Promise.all(
        ingredients.map((row) =>
          RecipesAPI.addItem(recipe.id, {
            productId: parseInt(row.productId, 10),
            quantity: parseFloat(row.quantity),
            unit: row.unit,
          }),
        ),
      );

      toast('Receta creada correctamente', 'success');
      onCreated();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Error al crear la receta', 'error');
      // If recipe was created but items failed, clean up
      if (createdRecipeId) {
        try {
          await RecipesAPI.delete(createdRecipeId);
        } catch {
          /* ignore */
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const finishedGoods = products.filter(
    (p) => p.type === 'finished_good' || p.type === 'sub_assembly',
  );
  const rawMaterials = products.filter((p) => p.type === 'raw_material');
  // If no raw materials, allow all products as ingredients
  const ingredientCandidates = rawMaterials.length > 0 ? rawMaterials : products;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Nueva Receta
            </p>
            <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.25rem' }}>
              Constructor de Receta / BOM
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--muted)',
            }}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Section 1: Product + header */}
          <div>
            <h4
              style={{
                margin: '0 0 1rem',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                letterSpacing: '0.06em',
              }}
            >
              1 · Producto terminado
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Producto *</label>
                <select
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'white',
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {finishedGoods.length > 0
                    ? finishedGoods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    : products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre receta *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Receta Croissant"
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rendimiento *</label>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={yieldQty}
                    onChange={(e) => setYieldQty(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      flex: 1,
                    }}
                  />
                  <span
                    style={{
                      padding: '0.5rem',
                      color: 'var(--muted)',
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    uds
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Ingredients */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  letterSpacing: '0.06em',
                }}
              >
                2 · Ingredientes (BOM)
              </h4>
              <button
                type="button"
                onClick={addIngredientLine}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: 'var(--panel-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                + Línea
              </button>
            </div>

            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 36px',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Ingrediente</span>
              <span>Cantidad</span>
              <span>Unidad</span>
              <span></span>
            </div>

            {ingredients.map((row, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 36px',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <select
                  value={row.productId}
                  onChange={(e) => updateIngredientLine(index, 'productId', e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'white',
                  }}
                >
                  <option value="">— Ingrediente —</option>
                  {ingredientCandidates.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.baseUnit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={row.quantity}
                  onChange={(e) => updateIngredientLine(index, 'quantity', e.target.value)}
                  placeholder="0.00"
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <select
                  value={row.unit}
                  onChange={(e) => updateIngredientLine(index, 'unit', e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'white',
                  }}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredientLine(index)}
                  disabled={ingredients.length === 1}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: ingredients.length === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    opacity: ingredients.length === 1 ? 0.3 : 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {ingredients.length === 0 && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                ⚠ Añade al menos un ingrediente
              </p>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--muted)',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Creando receta…' : 'Crear Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  recipe: Recipe;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

function DeleteConfirmModal({ recipe, onConfirm, onCancel, deleting }: DeleteConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel)',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem' }}>¿Eliminar receta?</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
          Se eliminará <strong>"{recipe.name}"</strong> y todos sus ingredientes. Esta acción no se
          puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '0.5rem 1rem',
              background: deleting ? '#fca5a5' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RecipesPage() {
  const toast = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [r, p] = await Promise.all([RecipesAPI.list(), CatalogAPI.getProducts()]);
      setRecipes(r ?? []);
      setProducts(p ?? []);
    } catch (err: any) {
      toast(err.message || 'Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deletingRecipe) return;
    try {
      setDeleteInProgress(true);
      await RecipesAPI.delete(deletingRecipe.id);
      toast('Receta eliminada', 'success');
      setDeletingRecipe(null);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Error al eliminar receta', 'error');
    } finally {
      setDeleteInProgress(false);
    }
  };

  // Enrich recipes with product name
  const enriched = recipes.map((r) => ({
    ...r,
    productName: products.find((p) => p.id === r.productId)?.name ?? `Producto #${r.productId}`,
  }));

  // Filter
  const filtered = enriched.filter((r) => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeCount = recipes.filter((r) => r.status === 'active').length;
  const draftCount = recipes.filter((r) => r.status === 'draft').length;

  return (
    <div className="content animate-in">
      {/* Page Header */}
      <div className="flex-between mb-8">
        <div>
          <p className="eyebrow">Recetas / BOM</p>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Escandallos y Fórmulas
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>
            {recipes.length} recetas totales · {activeCount} activas
          </p>
        </div>
        <button id="btn-new-recipe" className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nueva Receta
        </button>
      </div>

      {/* KPI summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
        }}
      >
        <article className="kpi-card">
          <span className="kpi-label">Total recetas</span>
          <strong className="kpi-value">{loading ? '…' : recipes.length}</strong>
          <p className="kpi-detail">En el catálogo</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Activas</span>
          <strong className="kpi-value" style={{ color: '#059669' }}>
            {loading ? '…' : activeCount}
          </strong>
          <p className="kpi-detail">Disponibles para producción</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Borradores</span>
          <strong className="kpi-value" style={{ color: '#d97706' }}>
            {loading ? '…' : draftCount}
          </strong>
          <p className="kpi-detail">Pendientes de activar</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Productos cubiertos</span>
          <strong className="kpi-value">
            {loading ? '…' : new Set(recipes.map((r) => r.productId)).size}
          </strong>
          <p className="kpi-detail">Con al menos una receta</p>
        </article>
      </div>

      {/* Filters */}
      <div className="flex-between mb-4 mt-8 animate-in animate-delay-1">
        <input
          type="search"
          placeholder="Buscar por producto o nombre…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            minWidth: '320px',
            background: 'var(--panel)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
        <div className="tabs">
          {(['all', 'active', 'draft', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`tab-btn ${filterStatus === s ? 'active' : ''}`}
            >
              {s === 'all' ? 'Todas' : (STATUS_META[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Table */}
      <div className="card animate-in animate-delay-2" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ border: 'none' }} className="empty-state">
            <h3>{recipes.length === 0 ? 'Sin recetas todavía' : 'Sin resultados'}</h3>
            <p>
              {recipes.length === 0
                ? 'Crea tu primera receta para comenzar a gestionar el BOM de producción.'
                : 'Prueba con otros filtros o términos de búsqueda.'}
            </p>
            {recipes.length === 0 && (
              <button className="btn-primary mt-4" onClick={() => setShowCreate(true)}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nueva Receta
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Producto Terminado</th>
                  <th>Nombre Receta</th>
                  <th className="text-center">Estado</th>
                  <th className="text-right">Rendimiento</th>
                  <th className="text-right">Versión</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--panel-muted)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '';
                    }}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text)' }}>
                      {r.productName}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--muted)' }}>{r.name}</td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 500 }}>
                      {r.yieldQuantity} uds
                    </td>
                    <td
                      style={{
                        padding: '0.875rem 1rem',
                        textAlign: 'right',
                        color: 'var(--muted)',
                      }}
                    >
                      v{r.version}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setEditingRecipe(r)}
                          style={{
                            padding: '0.3rem 0.75rem',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeletingRecipe(r)}
                          style={{
                            padding: '0.3rem 0.75rem',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateRecipeModal
          products={products}
          onClose={() => setShowCreate(false)}
          onCreated={loadData}
        />
      )}
      {editingRecipe && (
        <RecipeDetailModal
          recipe={editingRecipe}
          products={products}
          onClose={() => setEditingRecipe(null)}
          onUpdated={loadData}
        />
      )}
      {deletingRecipe && (
        <DeleteConfirmModal
          recipe={deletingRecipe}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRecipe(null)}
          deleting={deleteInProgress}
        />
      )}
    </div>
  );
}
