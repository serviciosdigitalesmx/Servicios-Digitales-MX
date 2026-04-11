"use client";

import React, { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  DollarSign,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiClient } from "../../lib/apiClient";
import { useApiData } from "../../hooks/useApiData";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Supplier = {
  id: string;
  businessName: string;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  supplierName?: string | null;
  stockCurrent: number;
  minimumStock: number;
  cost: number;
  salePrice: number;
};

type StockLevel = "agotado" | "critico" | "bajo" | "normal";

const initialProductForm = {
  sku: "",
  name: "",
  category: "",
  brand: "",
  primarySupplierId: "",
  cost: "0",
  salePrice: "0",
  minimumStock: "0",
  initialStock: "0",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getStockLevel(product: Product): StockLevel {
  if (product.stockCurrent <= 0) return "agotado";
  if (product.stockCurrent <= Math.max(1, product.minimumStock * 0.5)) return "critico";
  if (product.stockCurrent <= product.minimumStock) return "bajo";
  return "normal";
}

function getLevelMeta(level: StockLevel) {
  switch (level) {
    case "agotado":
      return {
        label: "Agotado",
        card: "bg-red-500/10 border-red-500/20 text-red-500",
      };
    case "critico":
      return {
        label: "Critico",
        card: "bg-orange-500/10 border-orange-500/20 text-orange-400",
      };
    case "bajo":
      return {
        label: "Stock Bajo",
        card: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
      };
    default:
      return {
        label: "Activo",
        card: "bg-green-500/10 border-green-500/20 text-green-400",
      };
  }
}

export default function InventoryPanel() {
  const {
    data: products,
    loading: loadingProducts,
    error: productsError,
    refresh: refreshProducts,
  } = useApiData<Product[]>("/api/products");
  const {
    data: suppliers,
    loading: loadingSuppliers,
    error: suppliersError,
  } = useApiData<Supplier[]>("/api/suppliers");

  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [productForm, setProductForm] = useState(initialProductForm);

  const loading = loadingProducts || loadingSuppliers;
  const apiError = productsError || suppliersError;
  const productList = Array.isArray(products) ? products : [];
  const supplierList = Array.isArray(suppliers) ? suppliers : [];

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return productList.filter((product) => {
      if (!normalized) return true;
      return (
        product.sku.toLowerCase().includes(normalized) ||
        product.name.toLowerCase().includes(normalized) ||
        (product.brand || "").toLowerCase().includes(normalized) ||
        (product.category || "").toLowerCase().includes(normalized) ||
        (product.supplierName || "").toLowerCase().includes(normalized)
      );
    });
  }, [productList, search]);

  const stats = useMemo(() => {
    return {
      total: productList.length,
      alerts: productList.filter((product) => getStockLevel(product) !== "normal").length,
      out: productList.filter((product) => product.stockCurrent <= 0).length,
      value: productList.reduce((sum, product) => sum + product.stockCurrent * product.cost, 0),
    };
  }, [productList]);

  const criticalProducts = useMemo(() => {
    return productList
      .filter((product) => getStockLevel(product) !== "normal")
      .sort((a, b) => a.stockCurrent - b.stockCurrent)
      .slice(0, 6);
  }, [productList]);

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProduct(true);
    setCreateError("");
    setCreateMessage("");

    try {
      const result = await apiClient.post<Product>("/api/products", {
        sku: productForm.sku.trim(),
        name: productForm.name.trim(),
        category: productForm.category.trim() || null,
        brand: productForm.brand.trim() || null,
        primarySupplierId: productForm.primarySupplierId || null,
        cost: Number(productForm.cost || 0),
        salePrice: Number(productForm.salePrice || 0),
        minimumStock: Number(productForm.minimumStock || 0),
        initialStock: Number(productForm.initialStock || 0),
      });

      if (!result.success) {
        throw new Error(result.error?.message || "No se pudo guardar el producto.");
      }

      await refreshProducts();
      setProductForm(initialProductForm);
      setShowCreateModal(false);
      setCreateMessage("Producto creado y sincronizado con inventario real.");
    } catch (error: any) {
      setCreateError(error.message || "No se pudo guardar el producto.");
    } finally {
      setSavingProduct(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-xl gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-extrabold text-white">Gestion de Inventario</h1>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mt-1">
            Conectado al backend real de productos y proveedores
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por SKU, nombre o proveedor..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-accent-blue transition-all"
            />
          </div>
          <button
            onClick={() => {
              setCreateError("");
              setShowCreateModal(true);
            }}
            className="bg-accent-blue hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm"
          >
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </header>

      {createMessage ? (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-100">
          {createMessage}
        </div>
      ) : null}

      {apiError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {apiError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Productos en Stock", value: stats.total, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Alertas Activas", value: stats.alerts, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Agotados", value: stats.out, icon: X, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Valor Inventario", value: formatMoney(stats.value), icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-black/40 border border-white/10 rounded-[32px] p-6 hover:scale-[1.02] transition-all group shadow-2xl backdrop-blur-md">
            <div className={cn("p-3 rounded-xl w-fit mb-4", stat.bg, stat.color)}>
              <stat.icon size={20} />
            </div>
            <div className="text-2xl font-jakarta font-black text-white mb-1">{loading ? "..." : stat.value}</div>
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-card p-6 border-white/5 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={16} className="text-accent-orange" /> Stock Critico
            </h3>
            <div className="space-y-4">
              {criticalProducts.length === 0 ? (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm text-slate-300">
                  El inventario actual se ve saludable.
                </div>
              ) : (
                criticalProducts.map((product) => {
                  const meta = getLevelMeta(getStockLevel(product));
                  return (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="w-full text-left group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent-orange/30 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <span className="text-[10px] font-mono text-accent-orange">{product.sku}</span>
                        <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full border", meta.card)}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate mb-2">{product.name}</p>
                      <div className="flex justify-between items-center text-[10px] text-text-secondary">
                        <span>Actual: {product.stockCurrent}</span>
                        <span>Min: {product.minimumStock}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] text-left">
                    <th className="px-6 py-4">SKU / Producto</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Proveedor</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-right">Precio</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map((product) => {
                    const level = getStockLevel(product);
                    const meta = getLevelMeta(level);
                    return (
                      <tr
                        key={product.id}
                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-accent-blue">{product.sku}</span>
                            <span className="text-sm font-bold text-white mt-1 group-hover:text-accent-blue transition-colors">
                              {product.name}
                            </span>
                            <span className="text-[10px] text-text-secondary font-medium tracking-tight">
                              {product.brand || "Sin marca"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-text-secondary bg-white/5 px-3 py-1 rounded-full">
                            {product.category || "Sin categoria"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {product.supplierName || "Sin proveedor"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={cn("text-sm font-black", level !== "normal" ? "text-accent-orange" : "text-white")}>
                              {product.stockCurrent}
                            </span>
                            <span className="text-[8px] text-text-secondary uppercase font-bold tracking-widest">
                              Min: {product.minimumStock}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-white">{formatMoney(product.salePrice)}</span>
                            <span className="text-[10px] text-text-secondary">Costo: {formatMoney(product.cost)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", meta.card)}>
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No hay productos reales disponibles con esos filtros.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="bg-[#121214] border border-white/10 w-full max-w-2xl rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-jakarta font-black text-white">{selectedProduct.name}</h3>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em]">
                    SKU {selectedProduct.sku}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-text-secondary hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DetailCard label="Categoria" value={selectedProduct.category || "Sin categoria"} />
              <DetailCard label="Marca" value={selectedProduct.brand || "Sin marca"} />
              <DetailCard label="Proveedor" value={selectedProduct.supplierName || "Sin proveedor"} />
              <DetailCard label="Stock actual" value={String(selectedProduct.stockCurrent)} />
              <DetailCard label="Stock minimo" value={String(selectedProduct.minimumStock)} />
              <DetailCard label="Costo" value={formatMoney(selectedProduct.cost)} />
              <DetailCard label="Precio" value={formatMoney(selectedProduct.salePrice)} />
              <DetailCard label="Valor en existencia" value={formatMoney(selectedProduct.stockCurrent * selectedProduct.cost)} />
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="bg-[#121214] border border-white/10 w-full max-w-2xl rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue">
                  <Plus size={24} />
                </div>
                <h3 className="text-2xl font-jakarta font-black text-white">Nuevo Producto Real</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-8 space-y-6">
              {createError ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {createError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField label="SKU">
                  <input
                    value={productForm.sku}
                    onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })}
                    className="w-full input-srf p-3 font-mono font-bold text-accent-blue"
                    required
                  />
                </FormField>
                <FormField label="Nombre">
                  <input
                    value={productForm.name}
                    onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                    className="w-full input-srf p-3"
                    required
                  />
                </FormField>
                <FormField label="Categoria">
                  <input
                    value={productForm.category}
                    onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}
                    className="w-full input-srf p-3"
                  />
                </FormField>
                <FormField label="Marca">
                  <input
                    value={productForm.brand}
                    onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })}
                    className="w-full input-srf p-3"
                  />
                </FormField>
                <FormField label="Proveedor">
                  <select
                    value={productForm.primarySupplierId}
                    onChange={(event) => setProductForm({ ...productForm, primarySupplierId: event.target.value })}
                    className="w-full input-srf p-3"
                  >
                    <option value="">Sin proveedor</option>
                    {supplierList.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.businessName}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Stock inicial">
                  <input
                    type="number"
                    min="0"
                    value={productForm.initialStock}
                    onChange={(event) => setProductForm({ ...productForm, initialStock: event.target.value })}
                    className="w-full input-srf p-3"
                  />
                </FormField>
                <FormField label="Costo">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.cost}
                    onChange={(event) => setProductForm({ ...productForm, cost: event.target.value })}
                    className="w-full input-srf p-3"
                  />
                </FormField>
                <FormField label="Precio">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.salePrice}
                    onChange={(event) => setProductForm({ ...productForm, salePrice: event.target.value })}
                    className="w-full input-srf p-3"
                  />
                </FormField>
                <FormField label="Stock minimo">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.minimumStock}
                    onChange={(event) => setProductForm({ ...productForm, minimumStock: event.target.value })}
                    className="w-full input-srf p-3"
                  />
                </FormField>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/5 text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 btn-accent py-4 text-xs uppercase tracking-widest font-bold"
                >
                  {savingProduct ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">{label}</p>
      <p className="text-white font-bold text-lg">{value}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">{label}</label>
      {children}
    </div>
  );
}
