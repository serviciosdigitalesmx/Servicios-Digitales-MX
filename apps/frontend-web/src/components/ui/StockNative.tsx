"use client";

import { FormEvent, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import { useApiData } from "../../hooks/useApiData";
import { FeatureGuard } from "./FeatureGuard";
import { PlanLevel } from "../../lib/subscription";

type Supplier = { id: string; businessName: string; };

type Product = {
  id: string; sku: string; name: string; category?: string; brand?: string;
  cost: number; salePrice: number; minimumStock: number; stockCurrent: number; supplierName?: string;
};

function formatMoney(value: number) { 
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0); 
}

export function StockNative({ tenantId }: any = {}) {
  // 1. Hooks genéricos para carga de datos
  const { 
    data: suppliers, 
    loading: loadingSuppliers, 
    refresh: refreshSuppliers 
  } = useApiData<Supplier[]>('/api/suppliers');

  const { 
    data: products, 
    loading: loadingProducts, 
    error: apiStateError, 
    refresh: refreshProducts 
  } = useApiData<Product[]>('/api/products');

  const loading = loadingSuppliers || loadingProducts;
  
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [formErrorSupplier, setFormErrorSupplier] = useState("");
  const [formErrorProduct, setFormErrorProduct] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  const [supplierForm, setSupplierForm] = useState({ 
    businessName: "", contactName: "", phone: "", email: "", categories: "", notes: "" 
  });
  const [productForm, setProductForm] = useState({ 
    sku: "", name: "", category: "", brand: "", compatibleModel: "", 
    primarySupplierId: "", cost: "0", salePrice: "0", minimumStock: "0", 
    unit: "pieza", location: "", notes: "", initialStock: "0" 
  });

  async function handleSupplierSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); 
    setFormErrorSupplier(""); 
    setApiStateMessage("");

    if (!supplierForm.businessName.trim()) {
      return setFormErrorSupplier("⚠️ El nombre del proveedor es obligatorio.");
    }
    
    try {
      const result = await apiClient.post('/api/suppliers', {
        businessName: supplierForm.businessName.trim(),
        contactName: supplierForm.contactName.trim() || null,
        phone: supplierForm.phone.trim() || null,
        email: supplierForm.email.trim() || null,
        categories: supplierForm.categories.trim() || null,
        notes: supplierForm.notes.trim() || null
      });

      if (!result.success) throw new Error(result.error?.message || "Error al crear el proveedor.");

      setSupplierForm({ businessName: "", contactName: "", phone: "", email: "", categories: "", notes: "" });
      await refreshSuppliers();
      setApiStateMessage("✅ Nuevo proveedor integrado.");
    } catch (error: any) { 
      setFormErrorSupplier(error.message); 
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); 
    setFormErrorProduct(""); 
    setApiStateMessage("");

    if (!productForm.sku.trim()) return setFormErrorProduct("⚠️ SKU obligatorio para rastrear stock.");
    if (!productForm.name.trim()) return setFormErrorProduct("⚠️ Es obligatorio titular tu ficha de inventario.");

    try {
      const result = await apiClient.post('/api/products', {
        sku: productForm.sku.trim(),
        name: productForm.name.trim(),
        category: productForm.category.trim() || null,
        brand: productForm.brand.trim() || null,
        compatibleModel: productForm.compatibleModel.trim() || null,
        primarySupplierId: productForm.primarySupplierId || null,
        cost: Number(productForm.cost || 0),
        salePrice: Number(productForm.salePrice || 0),
        minimumStock: Number(productForm.minimumStock || 0),
        initialStock: Number(productForm.initialStock || 0),
        unit: productForm.unit,
        location: productForm.location.trim() || null,
        notes: productForm.notes.trim() || null
      });

      if (!result.success) throw new Error(result.error?.message || "Error al crear el producto.");

      setProductForm({ 
        sku: "", name: "", category: "", brand: "", compatibleModel: "", 
        primarySupplierId: "", cost: "0", salePrice: "0", minimumStock: "0", 
        unit: "pieza", location: "", notes: "", initialStock: "0" 
      });
      await refreshProducts();
      setApiStateMessage("✅ Unidad indexada al stock general.");
    } catch (error: any) { 
      setFormErrorProduct(error.message);
    }
  }

  const filteredProducts = (products || []).filter(p => 
    !searchProduct || 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <FeatureGuard requiredLevel={PlanLevel.INTEGRAL} featureName="Control de Inventarios">
      <section className="module-native-shell">
        <div className="module-native-header">
          <div className="flex-col">
            <span className="hero-eyebrow">Almacén General</span>
            <h1>Stock y Refacciones</h1>
            <p className="muted">Administra recepciones de mercancía física, existencias mínimas y altas base.</p>
          </div>
          <div className="module-native-actions flex-row-between" style={{flex: 1, justifyContent: 'flex-end', gap: '12px'}}>
             <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
              <span style={{ position: "absolute", top: "14px", left: "14px", opacity: 0.5, fontSize: "1.1rem" }}>🔍</span>
              <input 
                className="module-search-input" 
                style={{ width: "100%", paddingLeft: "42px", paddingRight: "16px", height: "48px" }}
                placeholder="Buscar insumo o código universal..." 
                value={searchProduct} 
                onChange={(e) => setSearchProduct(e.target.value)} 
              />
             </div>
             <button type="button" disabled={loading} className="product-button" onClick={() => { refreshSuppliers(); refreshProducts(); }}>
               Actualizar Catálogo
            </button>
          </div>
        </div>

        {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
        {apiStateError && <div className="form-message is-error">{apiStateError}</div>}

        <div className="module-native-grid module-native-grid-wide">
          <form className="sdmx-card-premium" onSubmit={handleSupplierSubmit}>
            <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
               <h3 style={{fontSize: '1.25rem', margin: 0}}>Catálogo de Proveedores</h3>
               <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Añade contactos y orígenes de refacciones.</p>
            </div>
            {formErrorSupplier && <div className="form-message is-warning">{formErrorSupplier}</div>}
            <div className="flex-col" style={{marginBottom: '10px'}}>
               <label style={{fontWeight: 'bold'}}>Nombre Comercial *</label>
               <input value={supplierForm.businessName} onChange={(e) => setSupplierForm({ ...supplierForm, businessName: e.target.value })} placeholder="Ej. Mayoristas GSM"/>
            </div>
            <div className="grid-cols-2" style={{marginBottom: '10px'}}>
               <div className="flex-col"><label style={{margin:0}}>Teléfono</label><input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="Cel/Tel"/></div>
               <div className="flex-col"><label style={{margin:0}}>Correo</label><input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="Ej. ventas@mayor.com"/></div>
            </div>
            <button type="submit" disabled={loading} className="product-button is-primary" style={{marginTop: '16px'}}>
              {loading ? "Guardando..." : "Guardar Proveedor"}
            </button>
          </form>

          <form className="sdmx-card-premium" onSubmit={handleProductSubmit}>
            <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
               <h3 style={{fontSize: '1.25rem', margin: 0}}>Alta de Producto / Refacción</h3>
               <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Agrega inventario a las existencias para consumirlo en órdenes o venta suelta.</p>
            </div>
            {formErrorProduct && <div className="form-message is-warning">{formErrorProduct}</div>}
            
            <div className="grid-cols-auto" style={{marginBottom: '10px'}}>
               <div className="flex-col"><label style={{margin:0, fontWeight: 'bold'}}>Código (SKU) *</label><input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="BARR-1029"/></div>
               <div className="flex-col"><label style={{margin:0, fontWeight: 'bold'}}>Nombre o Descripción *</label><input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Placa Base, Circuito..."/></div>
            </div>
            
            <div className="grid-cols-3" style={{marginBottom: '10px'}}>
               <div className="flex-col"><label style={{margin:0}}>Marca</label><input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} /></div>
               <div className="flex-col"><label style={{margin:0}}>Categoría</label><input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} placeholder="Familia" /></div>
               <div className="flex-col"><label style={{margin:0, color: '#b91c1c', fontWeight: 'bold'}}>Costo Proveedor</label><input type="number" min="0" step="0.01" value={productForm.cost} onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })} /></div>
            </div>

            <div className="flex-col" style={{background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '10px'}}>
               <label style={{margin:0}}>Vincular a Proveedor (Opcional)</label>
               <select value={productForm.primarySupplierId} onChange={(e) => setProductForm({ ...productForm, primarySupplierId: e.target.value })}>
                 <option value="">-- No adjudicar a Proveedor --</option>
                 {(suppliers || []).map((sup) => (<option key={sup.id} value={sup.id}>{sup.businessName}</option>))}
               </select>
            </div>
            
            <div className="grid-cols-3">
               <div className="flex-col"><label style={{margin:0, color: '#10b981', fontWeight: 'bold'}}>Precio Público</label><input type="number" min="0" step="0.01" value={productForm.salePrice} onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })} /></div>
               <div className="flex-col"><label style={{margin:0}}>Stock Mínimo</label><input type="number" min="0" step="0.01" value={productForm.minimumStock} onChange={(e) => setProductForm({ ...productForm, minimumStock: e.target.value })} /></div>
               <div className="flex-col"><label style={{margin:0}}>Existencia Inicial</label><input type="number" min="0" step="0.01" value={productForm.initialStock} onChange={(e) => setProductForm({ ...productForm, initialStock: e.target.value })} /></div>
            </div>
            <button type="submit" disabled={loading} className="product-button is-primary" style={{marginTop: '16px'}}>
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </form>
        </div>
        
        <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column", marginTop: '20px'}}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Catálogo de Productos</h3>
             <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>Mostrando {filteredProducts.length} producto(s).</p>
          </div>

          {loading && !products ? (
            <div className="text-center py-10 opacity-50">Cargando catálogo de productos...</div>
          ) : (
            <ul className="data-list scrollable-list">
              {filteredProducts.length === 0 ? (
                <li className="empty-state">
                   <strong>No hay productos registrados</strong>
                   <span>Agrega refacciones o artículos en el formulario lateral.</span>
                </li>
              ) : (
                filteredProducts.map((p) => {
                   const lowStock = p.stockCurrent <= p.minimumStock;
                   return (
                  <li key={p.id} className="list-item-grid">
                    <span className={`badge-${lowStock ? 'danger' : 'success'}`} style={{minWidth: '60px'}}>
                       {p.stockCurrent} pzas.
                    </span>
                    <div className="flex-col">
                      <strong style={{fontSize: '1.05rem', color: '#0f172a'}}>SKU: {p.sku} | {p.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Ensamblador: {p.brand || "Genérico"} · Categoría: {p.category || "Ninguna"}
                        {p.supplierName ? ` · Prov: ${p.supplierName}` : ""}
                      </span>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <span style={{fontWeight: '900', color: '#10b981', background: '#ecfdf5', padding: '6px 14px', borderRadius: '8px', fontSize: '1.1rem'}}>{formatMoney(p.salePrice)}</span>
                    </div>
                  </li>
                )})
              )}
            </ul>
          )}
        </article>
      </section>
    </FeatureGuard>
  );
}
