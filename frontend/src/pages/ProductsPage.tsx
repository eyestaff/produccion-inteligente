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
        CatalogAPI.getBusinessLines()
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
    switch(t) {
      case 'raw_material': return 'Materia Prima';
      case 'sub_assembly': return 'Subensamble';
      case 'finished_good': return 'Producto Final';
      case 'service': return 'Servicio';
      default: return t;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', color: '#1e293b' }}>Catálogo Maestro</h1>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Gestiona categorías y productos.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setActiveTab('products')}
            style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: activeTab === 'products' ? '#e2e8f0' : 'white', borderRadius: '6px', cursor: 'pointer' }}
          >
            Productos
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: activeTab === 'categories' ? '#e2e8f0' : 'white', borderRadius: '6px', cursor: 'pointer' }}
          >
            Categorías
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Listado de Productos</h3>
            <button className="btn-primary" onClick={openNewProduct}>+ Nuevo Producto</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>SKU</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Nombre</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Categoría</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Tipo</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>UoM</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Costo</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Precio</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ padding: '1rem', textAlign: 'center' }}>Cargando...</td></tr> : 
                products.length === 0 ? <tr><td colSpan={8} style={{ padding: '1rem', textAlign: 'center' }}>No hay productos</td></tr> :
                products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace' }}>{p.code}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.categoryName || '-'}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                        {formatType(p.type)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.baseUnit}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>${p.cost.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>${p.price.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <button onClick={() => openEditProduct(p)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Gestión de Categorías</h3>
            <button className="btn-primary" onClick={() => setShowCategoryModal(true)}>+ Nueva Categoría</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Nombre</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>Cargando...</td></tr> : 
                categories.length === 0 ? <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>No hay categorías</td></tr> :
                categories.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{c.id}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--muted)' }}>{c.description || '-'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>SKU / Código *</label>
                  <input required value={code} onChange={e => setCode(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nombre *</label>
                  <input required value={name} onChange={e => setName(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tipo *</label>
                  <select value={type} onChange={e => setType(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="raw_material">Materia Prima</option>
                    <option value="sub_assembly">Subensamble</option>
                    <option value="finished_good">Producto Terminado</option>
                    <option value="service">Servicio</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Unidad Base (UoM) *</label>
                  <select value={baseUnit} onChange={e => setBaseUnit(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="u">Unidades (u)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="l">Litros (l)</option>
                    <option value="ml">Mililitros (ml)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Costo Estándar</label>
                  <input type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Precio de Venta</label>
                  <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Categoría</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="">- Seleccionar -</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Línea de Negocio</label>
                  <select value={businessLineId} onChange={e => setBusinessLineId(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="">- Seleccionar -</option>
                    {businessLines.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowProductModal(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Nueva Categoría</h2>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nombre *</label>
                <input required value={catName} onChange={e => setCatName(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Descripción</label>
                <textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
