import { useState, useEffect } from 'react';
import { CatalogAPI, Product, Category, BusinessLine } from '../services/catalog';
import { useToast } from '../ui/ToastProvider';

export function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'products' | 'categories'
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Product Form
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('finished_good');
  const [baseUnit, setBaseUnit] = useState('u');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [businessLineId, setBusinessLineId] = useState('');

  // Category Form
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats, lines] = await Promise.all([
        CatalogAPI.getProducts(),
        CatalogAPI.getCategories(),
        CatalogAPI.getBusinessLines(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setBusinessLines(lines);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code,
        name,
        type,
        baseUnit,
        cost: parseFloat(cost) || 0,
        price: parseFloat(price) || 0,
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        businessLineId: businessLineId ? parseInt(businessLineId, 10) : null,
      };

      if (isEditing && editId) {
        await CatalogAPI.updateProduct(editId, payload);
        toast('Producto actualizado', 'success');
      } else {
        await CatalogAPI.createProduct(payload);
        toast('Producto creado', 'success');
      }
      setShowProductModal(false);
      loadData();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const openNewProduct = () => {
    setCode('');
    setName('');
    setType('finished_good');
    setBaseUnit('u');
    setCost('');
    setPrice('');
    setCategoryId('');
    setBusinessLineId('');
    setIsEditing(false);
    setEditId(null);
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setCode(p.code);
    setName(p.name);
    setType(p.type);
    setBaseUnit(p.baseUnit);
    setCost(p.cost.toString());
    setPrice(p.price.toString());
    setCategoryId(p.categoryId ? p.categoryId.toString() : '');
    setBusinessLineId(p.businessLineId ? p.businessLineId.toString() : '');
    setIsEditing(true);
    setEditId(p.id);
    setShowProductModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await CatalogAPI.createCategory({ name: catName, description: catDesc });
      toast('Categoría creada', 'success');
      setShowCategoryModal(false);
      setCatName('');
      setCatDesc('');
      loadData();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const formatType = (t: string) => {
    switch (t) {
      case 'raw_material':
        return { label: 'Materia Prima', class: 'badge-info' };
      case 'sub_assembly':
        return { label: 'Subensamble', class: 'badge-info' };
      case 'finished_good':
        return { label: 'Producto Final', class: 'badge-success' };
      case 'service':
        return { label: 'Servicio', class: '' };
      default:
        return { label: t, class: '' };
    }
  };

  return (
    <div className="content animate-in">
      <div className="flex-between mb-8">
        <div>
          <p className="eyebrow">Catálogo Maestro</p>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Productos & Categorías
          </h2>
        </div>
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Productos
          </button>
          <button
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categorías
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="card animate-in animate-delay-1">
          <div className="flex-between mb-4">
            <h3 style={{ margin: 0 }}>Listado de Productos</h3>
            <button className="btn-primary" onClick={openNewProduct}>
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
              Nuevo Producto
            </button>
          </div>
          <div className="table-responsive">
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th>UoM</th>
                    <th className="text-right">Costo</th>
                    <th className="text-right">Precio</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center">
                        Cargando...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center" style={{ color: 'var(--muted)' }}>
                        No hay productos registrados.
                      </td>
                    </tr>
                  ) : (
                    products.map((p, i) => {
                      const typeInfo = formatType(p.type);
                      return (
                        <tr
                          key={p.id}
                          className="animate-in"
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.code}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td style={{ color: 'var(--muted)' }}>{p.categoryName || '-'}</td>
                          <td>
                            <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>
                          </td>
                          <td>
                            <span
                              style={{
                                background: 'rgba(0,0,0,0.05)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                              }}
                            >
                              {p.baseUnit}
                            </span>
                          </td>
                          <td className="text-right" style={{ fontWeight: 500 }}>
                            ${p.cost.toFixed(2)}
                          </td>
                          <td className="text-right" style={{ fontWeight: 500 }}>
                            ${p.price.toFixed(2)}
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => openEditProduct(p)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent)',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="card animate-in animate-delay-1">
          <div className="flex-between mb-4">
            <h3 style={{ margin: 0 }}>Gestión de Categorías</h3>
            <button className="btn-primary" onClick={() => setShowCategoryModal(true)}>
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
              Nueva Categoría
            </button>
          </div>
          <div className="table-responsive">
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center">
                        Cargando...
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center" style={{ color: 'var(--muted)' }}>
                        No hay categorías registradas.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c, i) => (
                      <tr
                        key={c.id}
                        className="animate-in"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <td style={{ color: 'var(--muted)' }}>#{c.id}</td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td style={{ color: 'var(--muted)' }}>{c.description || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form
              onSubmit={handleSaveProduct}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>SKU / Código *</label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej. PRD-001"
                  />
                </div>
                <div className="input-group">
                  <label>Nombre *</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Harina de Trigo"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Tipo *</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="raw_material">Materia Prima</option>
                    <option value="sub_assembly">Subensamble</option>
                    <option value="finished_good">Producto Terminado</option>
                    <option value="service">Servicio</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Unidad Base (UoM) *</label>
                  <select value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)}>
                    <option value="u">Unidades (u)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="l">Litros (l)</option>
                    <option value="ml">Mililitros (ml)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Costo Estándar</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="input-group">
                  <label>Precio de Venta</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Categoría</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">- Ninguna -</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Línea de Negocio</label>
                  <select
                    value={businessLineId}
                    onChange={(e) => setBusinessLineId(e.target.value)}
                  >
                    <option value="">- Ninguna -</option>
                    {businessLines.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-end gap-4 mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2>Nueva Categoría</h2>
            <form
              onSubmit={handleSaveCategory}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div className="input-group">
                <label>Nombre *</label>
                <input
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej. Lácteos"
                />
              </div>
              <div className="input-group">
                <label>Descripción</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Descripción opcional"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>
              <div className="flex-end gap-4 mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
