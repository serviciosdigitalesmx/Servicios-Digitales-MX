"use client";

import { FormEvent, useMemo, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import { useApiData } from "../../hooks/useApiData";
import { FeatureGuard } from "./FeatureGuard";
import { PlanLevel } from "../../lib/subscription";

type Supplier = { id: string; businessName: string; };

type Product = {
  id: string; sku: string; name: string; category?: string; brand?: string;
  cost: number; salePrice: number; minimumStock: number; stockCurrent: number; supplierName?: string;
};

type StockSeverity = "agotado" | "critico" | "bajo" | "saludable";

function formatMoney(value: number) { 
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0); 
}

function getStockSeverity(product: Product): StockSeverity {
  if (product.stockCurrent <= 0) return "agotado";
  if (product.stockCurrent <= Math.max(1, product.minimumStock * 0.5)) return "critico";
  if (product.stockCurrent <= product.minimumStock) return "bajo";
  return "saludable";
}

function getSeverityMeta(severity: StockSeverity) {
  switch (severity) {
    case "agotado":
      return {
        label: "Agotado",
        chipClass: "badge-danger",
        color: "#b91c1c",
        background: "#fef2f2",
        message: "Este artículo ya no tiene piezas disponibles. Conviene reabastecerlo cuanto antes."
      };
    case "critico":
      return {
        label: "Crítico",
        chipClass: "badge-danger",
        color: "#c2410c",
        background: "#fff7ed",
        message: "El inventario está por debajo de lo prudente para operación diaria."
      };
    case "bajo":
      return {
        label: "Bajo",
        chipClass: "badge-warning",
        color: "#a16207",
        background: "#fefce8",
        message: "Está cerca del mínimo. Conviene programar compra preventiva."
      };
    default:
      return {
        label: "Saludable",
        chipClass: "badge-success",
        color: "#047857",
        background: "#ecfdf5",
        message: "El nivel actual permite operar sin presión inmediata."
      };
  }
}

function getSeverityWeight(severity: StockSeverity) {
  switch (severity) {
    case "agotado":
      return 0;
    case "critico":
      return 1;
    case "bajo":
      return 2;
    default:
      return 3;
  }
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const inventorySummary = useMemo(() => {
    const productList = products || [];
    const severities = productList.map(getStockSeverity);
    return {
      totalProducts: productList.length,
      outOfStock: severities.filter((level) => level === "agotado").length,
      critical: severities.filter((level) => level === "critico").length,
      low: severities.filter((level) => level === "bajo").length,
      suppliers: new Set((suppliers || []).map((supplier) => supplier.id)).size,
      catalogValue: productList.reduce((sum, product) => sum + ((product.cost || 0) * (product.stockCurrent || 0)), 0)
    };
  }, [products, suppliers]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchProduct.trim().toLowerCase();
    return (products || [])
      .filter((product) =>
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch) ||
        (product.brand || "").toLowerCase().includes(normalizedSearch) ||
        (product.category || "").toLowerCase().includes(normalizedSearch) ||
        (product.supplierName || "").toLowerCase().includes(normalizedSearch)
      )
      .sort((a, b) => {
        const severityDiff = getSeverityWeight(getStockSeverity(a)) - getSeverityWeight(getStockSeverity(b));
        if (severityDiff !== 0) return severityDiff;
        return a.name.localeCompare(b.name, "es-MX");
      });
  }, [products, searchProduct]);

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

        <div className="grid-cols-3" style={{ marginBottom: "20px" }}>
          <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
            <span className="hero-eyebrow">Visión general</span>
            <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem" }}>{inventorySummary.totalProducts}</h3>
            <p className="muted" style={{ margin: 0 }}>SKUs activos en tu catálogo actual.</p>
          </article>
          <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
            <span className="hero-eyebrow">Foco inmediato</span>
            <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem", color: "#b91c1c" }}>
              {inventorySummary.outOfStock + inventorySummary.critical}
            </h3>
            <p className="muted" style={{ margin: 0 }}>
              {inventorySummary.outOfStock} agotados · {inventorySummary.critical} críticos.
            </p>
          </article>
          <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
            <span className="hero-eyebrow">Cobertura</span>
            <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem" }}>{formatMoney(inventorySummary.catalogValue)}</h3>
            <p className="muted" style={{ margin: 0 }}>
              Valor estimado en stock · {inventorySummary.suppliers} proveedor(es) conectados.
            </p>
          </article>
        </div>

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
             <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>
              Mostrando {filteredProducts.length} producto(s). {inventorySummary.low > 0 ? `${inventorySummary.low} artículo(s) están en vigilancia.` : "Tu inventario base está estable."}
             </p>
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
                  const severity = getStockSeverity(p);
                  const severityMeta = getSeverityMeta(severity);
                  const suggestedMargin = p.salePrice - p.cost;
                  return (
                  <li key={p.id} className="list-item-grid">
                    <span className={severityMeta.chipClass} style={{minWidth: '82px', textAlign: "center"}}>
                       {severityMeta.label}
                    </span>
                    <div className="flex-col">
                      <strong style={{fontSize: '1.05rem', color: '#0f172a'}}>SKU: {p.sku} | {p.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Marca: {p.brand || "Genérico"} · Categoría: {p.category || "Ninguna"}
                        {p.supplierName ? ` · Prov: ${p.supplierName}` : ""}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: severityMeta.color }}>
                        Stock actual: {p.stockCurrent} · mínimo esperado: {p.minimumStock} · margen sugerido: {formatMoney(suggestedMargin)}
                      </span>
                    </div>
                    <div style={{textAlign: 'right', display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px"}}>
                      <span style={{fontWeight: '900', color: '#10b981', background: '#ecfdf5', padding: '6px 14px', borderRadius: '8px', fontSize: '1.1rem'}}>{formatMoney(p.salePrice)}</span>
                      <button
                        type="button"
                        className="product-button"
                        style={{ minWidth: "132px" }}
                        onClick={() => setSelectedProduct(p)}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </li>
                )})
              )}
            </ul>
          )}
        </article>

        {selectedProduct ? (() => {
          const severity = getStockSeverity(selectedProduct);
          const severityMeta = getSeverityMeta(severity);
          const estimatedMargin = selectedProduct.salePrice - selectedProduct.cost;
          return (
            <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
              <div
                className="sdmx-card-premium"
                style={{ maxWidth: "720px", width: "100%", padding: "24px", margin: "32px auto" }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex-row-between" style={{ alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                  <div className="flex-col">
                    <span className="hero-eyebrow">Ficha de inventario</span>
                    <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.5rem" }}>{selectedProduct.name}</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      SKU {selectedProduct.sku} · {selectedProduct.brand || "Marca no capturada"} · {selectedProduct.category || "Categoría libre"}
                    </p>
                  </div>
                  <button type="button" className="product-button" onClick={() => setSelectedProduct(null)}>
                    Cerrar
                  </button>
                </div>

                <div className="grid-cols-2" style={{ marginBottom: "16px" }}>
                  <div style={{ padding: "16px", borderRadius: "16px", background: severityMeta.background }}>
                    <span className="hero-eyebrow">Severidad operativa</span>
                    <h4 style={{ margin: "8px 0 4px 0", fontSize: "1.25rem", color: severityMeta.color }}>{severityMeta.label}</h4>
                    <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>{severityMeta.message}</p>
                  </div>
                  <div style={{ padding: "16px", borderRadius: "16px", background: "#f8fafc" }}>
                    <span className="hero-eyebrow">Abastecimiento</span>
                    <h4 style={{ margin: "8px 0 4px 0", fontSize: "1.25rem" }}>
                      {selectedProduct.supplierName || "Sin proveedor asignado"}
                    </h4>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
                      Usa esta ficha para decidir si conviene reabastecer, ajustar precio o mover prioridad de compra.
                    </p>
                  </div>
                </div>

                <div className="grid-cols-3" style={{ marginBottom: "16px" }}>
                  <div className="sdmx-card-header">
                    <span className="hero-eyebrow">Stock actual</span>
                    <strong style={{ display: "block", marginTop: "6px", fontSize: "1.5rem" }}>{selectedProduct.stockCurrent}</strong>
                  </div>
                  <div className="sdmx-card-header">
                    <span className="hero-eyebrow">Mínimo esperado</span>
                    <strong style={{ display: "block", marginTop: "6px", fontSize: "1.5rem" }}>{selectedProduct.minimumStock}</strong>
                  </div>
                  <div className="sdmx-card-header">
                    <span className="hero-eyebrow">Margen sugerido</span>
                    <strong style={{ display: "block", marginTop: "6px", fontSize: "1.5rem" }}>{formatMoney(estimatedMargin)}</strong>
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="flex-col" style={{ gap: "10px" }}>
                    <div><strong>Costo proveedor:</strong> {formatMoney(selectedProduct.cost)}</div>
                    <div><strong>Precio público:</strong> {formatMoney(selectedProduct.salePrice)}</div>
                    <div><strong>Cobertura económica:</strong> {formatMoney(selectedProduct.cost * selectedProduct.stockCurrent)}</div>
                  </div>
                  <div className="flex-col" style={{ gap: "10px" }}>
                    <div><strong>Proveedor:</strong> {selectedProduct.supplierName || "Pendiente de asignar"}</div>
                    <div><strong>Categoría:</strong> {selectedProduct.category || "Sin categoría"}</div>
                    <div><strong>Marca:</strong> {selectedProduct.brand || "No capturada"}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })() : null}
      </section>
    </FeatureGuard>
  );
}
