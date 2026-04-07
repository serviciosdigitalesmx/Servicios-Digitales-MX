"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import { useApiData } from "../../hooks/useApiData";

type Branch = {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  phone?: string;
  isActive: boolean;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  stockCurrent: number;
};

type TransferDraft = {
  id: string;
  createdAt: string;
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  productLabel: string;
  quantity: number;
  notes?: string;
  status: "programada";
};

const TRANSFER_STORAGE_KEY = "sdmx_branch_transfer_drafts";

function getStoredTransfers(): TransferDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRANSFER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredTransfers(items: TransferDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(items));
}

export function SucursalesNative() {
  const {
    data: branches,
    loading: loadingBranches,
    error: apiStateError,
    refresh: loadBranches
  } = useApiData<Branch[]>("/api/branches");

  const {
    data: products,
    loading: loadingProducts
  } = useApiData<Product[]>("/api/products");

  const loading = loadingBranches || loadingProducts;

  const [apiStateMessage, setApiStateMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [transferError, setTransferError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferDraft[]>([]);

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    phone: ""
  });

  const [transferForm, setTransferForm] = useState({
    fromBranchId: "",
    toBranchId: "",
    productId: "",
    quantity: "1",
    notes: ""
  });

  useEffect(() => {
    setTransferHistory(getStoredTransfers());
  }, []);

  const branchSummary = useMemo(() => {
    const branchList = branches || [];
    return {
      total: branchList.length,
      active: branchList.filter((branch) => branch.isActive).length,
      inactive: branchList.filter((branch) => !branch.isActive).length,
      cities: new Set(branchList.map((branch) => `${branch.city || ""}-${branch.state || ""}`).filter(Boolean)).size,
      programmedTransfers: transferHistory.length
    };
  }, [branches, transferHistory]);

  const availableProducts = useMemo(
    () => (products || []).filter((product) => product.stockCurrent > 0),
    [products]
  );

  const recentTransfers = useMemo(
    () => [...transferHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [transferHistory]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setApiStateMessage("");

    if (!form.name.trim()) {
      setFormError("⚠️ El nombre de la sucursal es obligatorio.");
      return;
    }
    if (!form.code.trim()) {
      setFormError("⚠️ El código de la sucursal es obligatorio.");
      return;
    }

    try {
      const result = await apiClient.post("/api/branches", {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address,
        city: form.city,
        state: form.state,
        phone: form.phone,
        isActive: true
      });

      if (!result.success) {
        throw new Error(result.error?.message || "Error al guardar la sucursal.");
      }

      setForm({
        name: "",
        code: "",
        address: "",
        city: "",
        state: "",
        phone: ""
      });
      await loadBranches();
      setApiStateMessage("✅ Sucursal guardada exitosamente.");
    } catch (error: any) {
      setFormError(error.message);
    }
  }

  function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTransferError("");
    setApiStateMessage("");

    if (!transferForm.fromBranchId || !transferForm.toBranchId) {
      setTransferError("⚠️ Debes elegir origen y destino para la transferencia.");
      return;
    }
    if (transferForm.fromBranchId === transferForm.toBranchId) {
      setTransferError("⚠️ El origen y el destino no pueden ser la misma sucursal.");
      return;
    }

    const product = availableProducts.find((item) => item.id === transferForm.productId);
    if (!product) {
      setTransferError("⚠️ Elige un producto con existencia para programar la transferencia.");
      return;
    }

    const quantity = Number(transferForm.quantity || 0);
    if (!quantity || quantity <= 0) {
      setTransferError("⚠️ La cantidad debe ser mayor a cero.");
      return;
    }

    const transfer: TransferDraft = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      fromBranchId: transferForm.fromBranchId,
      toBranchId: transferForm.toBranchId,
      productId: product.id,
      productLabel: `${product.sku} · ${product.name}`,
      quantity,
      notes: transferForm.notes.trim() || undefined,
      status: "programada"
    };

    const nextHistory = [transfer, ...transferHistory];
    setTransferHistory(nextHistory);
    saveStoredTransfers(nextHistory);
    setTransferForm({
      fromBranchId: "",
      toBranchId: "",
      productId: "",
      quantity: "1",
      notes: ""
    });
    setApiStateMessage("✅ Transferencia programada localmente. Ya quedó registrada en la bitácora operativa del módulo.");
  }

  function branchLabel(id: string) {
    const branch = branches?.find((item) => item.id === id);
    return branch ? `${branch.name} (${branch.code || "NA"})` : "Sucursal no encontrada";
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Sucursales</span>
          <h1>Red de sucursales</h1>
          <p>Administra la red activa del negocio y coordina movimientos entre sedes con mejor contexto operativo.</p>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="console-message is-warning">{apiStateError}</div>}

      <div className="grid-cols-3" style={{ marginBottom: "20px" }}>
        <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
          <span className="hero-eyebrow">Cobertura</span>
          <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem" }}>{branchSummary.total}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {branchSummary.active} activas · {branchSummary.inactive} inactivas.
          </p>
        </article>
        <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
          <span className="hero-eyebrow">Alcance geográfico</span>
          <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem" }}>{branchSummary.cities}</h3>
          <p className="muted" style={{ margin: 0 }}>Ciudad(es) o plaza(s) identificadas en la red actual.</p>
        </article>
        <article className="sdmx-card-premium" style={{ padding: "18px 20px" }}>
          <span className="hero-eyebrow">Movimientos</span>
          <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.75rem" }}>{branchSummary.programmedTransfers}</h3>
          <p className="muted" style={{ margin: 0 }}>Transferencia(s) programadas localmente para seguimiento multisede.</p>
        </article>
      </div>

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <h3>Nueva sucursal</h3>
          <p className="muted" style={{ marginTop: "-4px", marginBottom: "12px" }}>Da de alta un punto operativo para integrarlo al control general.</p>
          {formError && <div className="form-message is-warning">{formError}</div>}

          <div className="grid-cols-auto">
            <label>
              Nombre de la sucursal *
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Taller Centro" />
            </label>
            <label>
              Código *
              <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Ej. CTR-01" />
            </label>
          </div>

          <label>
            Dirección
            <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Calle, plaza, local..." />
          </label>

          <div className="grid-cols-2">
            <label>
              Ciudad
              <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </label>
            <label>
              Estado
              <input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
            </label>
          </div>

          <label>
            Teléfono
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>

          <button type="submit" disabled={loading} className="product-button is-primary">
            {loading ? "Guardando..." : "Guardar sucursal"}
          </button>
        </form>

        <form className="sdmx-card-premium" onSubmit={handleTransferSubmit}>
          <h3>Programar transferencia</h3>
          <p className="muted" style={{ marginTop: "-4px", marginBottom: "12px" }}>
            Mientras cerramos el endpoint de transferencias, esta bitácora local ayuda a coordinar movimientos entre sedes sin perder contexto.
          </p>
          {transferError && <div className="form-message is-warning">{transferError}</div>}

          <div className="grid-cols-2">
            <label>
              Sucursal origen
              <select value={transferForm.fromBranchId} onChange={(event) => setTransferForm({ ...transferForm, fromBranchId: event.target.value })}>
                <option value="">Selecciona origen</option>
                {(branches || []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code || "NA"})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sucursal destino
              <select value={transferForm.toBranchId} onChange={(event) => setTransferForm({ ...transferForm, toBranchId: event.target.value })}>
                <option value="">Selecciona destino</option>
                {(branches || []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code || "NA"})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid-cols-2">
            <label>
              Producto
              <select value={transferForm.productId} onChange={(event) => setTransferForm({ ...transferForm, productId: event.target.value })}>
                <option value="">Selecciona producto</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.sku} · {product.name} ({product.stockCurrent})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Cantidad
              <input
                type="number"
                min="1"
                step="1"
                value={transferForm.quantity}
                onChange={(event) => setTransferForm({ ...transferForm, quantity: event.target.value })}
              />
            </label>
          </div>

          <label>
            Notas operativas
            <textarea
              rows={3}
              value={transferForm.notes}
              onChange={(event) => setTransferForm({ ...transferForm, notes: event.target.value })}
              placeholder="Ej. mover refacciones para entregar dos órdenes urgentes mañana."
            />
          </label>

          <button type="submit" disabled={loading} className="product-button is-primary">
            {loading ? "Guardando..." : "Programar transferencia"}
          </button>
        </form>

        <article className="sdmx-card-premium" style={{ display: "flex", flexDirection: "column" }}>
          <div className="flex-row-between">
            <div>
              <h3 style={{ marginBottom: "4px" }}>Sucursales activas</h3>
              <p className="muted" style={{ margin: 0 }}>
                {branches?.length || 0} sucursal(es) registradas en la red.
              </p>
            </div>
          </div>

          {loading && !branches ? (
            <div className="text-center py-10 opacity-50">Sincronizando red...</div>
          ) : (
            <ul className="data-list scrollable-list">
              {!branches || branches.length === 0 ? (
                <li className="empty-state">
                  <strong>No hay sucursales registradas.</strong>
                  <span>Agrega tu primera sucursal usando el formulario.</span>
                </li>
              ) : (
                branches.map((branch) => (
                  <li key={branch.id} className="list-item-grid">
                    <div style={{ background: "#3b82f6", color: "white", padding: "6px 14px", borderRadius: "8px", fontWeight: "bold", fontSize: "0.85rem" }}>
                      {branch.code || "NA"}
                    </div>
                    <div className="flex-col">
                      <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>{branch.name}</strong>
                      <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                        {branch.city || "Sin ciudad"}, {branch.state || "NA"}
                        {branch.phone ? ` · Contacto: ${branch.phone}` : ""}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                      <span className={`status-pill ${branch.isActive ? "is-success" : "is-warning"}`} style={{ minWidth: "72px", textAlign: "center" }}>
                        {branch.isActive ? "Activa" : "Inactiva"}
                      </span>
                      <button type="button" className="product-button" onClick={() => setSelectedBranch(branch)}>
                        Ver detalle
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </article>
      </div>

      <article className="sdmx-card-premium" style={{ display: "flex", flexDirection: "column", marginTop: "20px" }}>
        <div className="flex-row-between" style={{ marginBottom: "12px" }}>
          <div>
            <h3 style={{ marginBottom: "4px" }}>Historial de transferencias programadas</h3>
            <p className="muted" style={{ margin: 0 }}>Bitácora local de coordinación multisede hasta cerrar el backend definitivo.</p>
          </div>
        </div>

        {recentTransfers.length === 0 ? (
          <div className="empty-state">
            <strong>Aún no hay transferencias registradas.</strong>
            <span>Programa la primera para empezar a coordinar inventario entre sucursales.</span>
          </div>
        ) : (
          <ul className="data-list scrollable-list">
            {recentTransfers.map((transfer) => (
              <li key={transfer.id} className="list-item-grid">
                <span className="badge-info" style={{ minWidth: "92px", textAlign: "center" }}>
                  Programada
                </span>
                <div className="flex-col">
                  <strong style={{ fontSize: "1.02rem", color: "#0f172a" }}>{transfer.productLabel}</strong>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {branchLabel(transfer.fromBranchId)} → {branchLabel(transfer.toBranchId)}
                  </span>
                  {transfer.notes ? (
                    <span style={{ fontSize: "0.8rem", color: "#475569" }}>{transfer.notes}</span>
                  ) : null}
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ display: "block", color: "#0f172a" }}>{transfer.quantity} pza(s)</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {new Date(transfer.createdAt).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      {selectedBranch ? (
        <div className="modal-backdrop" onClick={() => setSelectedBranch(null)}>
          <div
            className="sdmx-card-premium"
            style={{ maxWidth: "700px", width: "100%", padding: "24px", margin: "32px auto" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex-row-between" style={{ alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
              <div className="flex-col">
                <span className="hero-eyebrow">Perfil de sucursal</span>
                <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.5rem" }}>{selectedBranch.name}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {selectedBranch.code || "Sin código"} · {selectedBranch.city || "Sin ciudad"}, {selectedBranch.state || "Sin estado"}
                </p>
              </div>
              <button type="button" className="product-button" onClick={() => setSelectedBranch(null)}>
                Cerrar
              </button>
            </div>

            <div className="grid-cols-3" style={{ marginBottom: "16px" }}>
              <div className="sdmx-card-header">
                <span className="hero-eyebrow">Estado</span>
                <strong style={{ display: "block", marginTop: "6px", fontSize: "1.35rem" }}>
                  {selectedBranch.isActive ? "Operando" : "En pausa"}
                </strong>
              </div>
              <div className="sdmx-card-header">
                <span className="hero-eyebrow">Contacto</span>
                <strong style={{ display: "block", marginTop: "6px", fontSize: "1rem" }}>
                  {selectedBranch.phone || "Sin teléfono"}
                </strong>
              </div>
              <div className="sdmx-card-header">
                <span className="hero-eyebrow">Transferencias ligadas</span>
                <strong style={{ display: "block", marginTop: "6px", fontSize: "1.35rem" }}>
                  {
                    recentTransfers.filter(
                      (transfer) => transfer.fromBranchId === selectedBranch.id || transfer.toBranchId === selectedBranch.id
                    ).length
                  }
                </strong>
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "16px", background: "#f8fafc" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>Lectura operativa</strong>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Usa esta vista para validar si la sucursal ya está integrada, si tiene contacto visible y cuántos movimientos programados la involucran. El siguiente paso fuerte aquí será cerrar transferencias reales de inventario contra backend.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
