"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "../../lib/apiClient";
import { useAuth } from "./AuthGuard";

type ArchivedOrder = {
  id: string;
  folio: string;
  status: string;
  customerName?: string;
  deviceType: string;
  priority?: string;
  estimatedCost: number;
  promisedDate?: string;
  archivedAt?: string;
};

type ArchivedOrderApiRow = {
  id: string;
  folio: string;
  status: string;
  customerName?: string | null;
  deviceType?: string | null;
  priority?: string | null;
  estimatedCost?: number | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  reportedIssue?: string | null;
  finalCost?: number | null;
  archivedAt?: string | null;
  deliveredAt?: string | null;
  updatedAt?: string | null;
};

type ArchiveFilter = "ALL" | "entregado" | "cancelado" | "archivado";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(dateStr?: string) {
  return dateStr ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr)) : "Indefinida";
}

function normalizeArchiveStatus(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function getArchiveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function mapArchivedOrderRow(order: ArchivedOrderApiRow): ArchivedOrder {
  return {
    id: order.id,
    folio: order.folio,
    status: order.status,
    customerName: order.customerName ?? undefined,
    deviceType: [order.deviceType, order.deviceBrand, order.deviceModel].filter(Boolean).join(" ") || "Equipo no especificado",
    priority: order.priority ?? undefined,
    estimatedCost: Number(order.estimatedCost ?? order.finalCost ?? 0),
    promisedDate: order.updatedAt ?? undefined,
    archivedAt: order.archivedAt ?? order.deliveredAt ?? order.updatedAt ?? undefined
  };
}

export function ArchivoNative() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [archived, setArchived] = useState<ArchivedOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArchiveFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [apiStateError, setApiStateError] = useState("");

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true);
    setApiStateError("");
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "100" });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const response = await fetchWithAuth(`/api/archive/service-orders?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo cargar el archivo histórico.");
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      setArchived(data.map((order: ArchivedOrderApiRow) => mapArchivedOrderRow(order)));
    } catch (error: unknown) {
      setApiStateError(getArchiveErrorMessage(error, "No se pudo cargar el archivo histórico."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [session, search, statusFilter, fromDate, toDate]);

  const archiveStats = useMemo(() => {
    return {
      entregadas: archived.filter((order) => normalizeArchiveStatus(order.status) === "entregado").length,
      canceladas: archived.filter((order) => normalizeArchiveStatus(order.status) === "cancelado").length,
      historico: archived.reduce((acc, curr) => acc + curr.estimatedCost, 0)
    };
  }, [archived]);

  return (
    <section className="operativo-shell">
      <div className="operativo-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Archivo general</span>
          <h1>Historial operativo del taller</h1>
          <p className="muted">Consulta entregas, cancelaciones y cierres para responder rápido, comprobar antecedentes y encontrar expedientes sin fricción.</p>
        </div>
        <div className="operativo-summary" style={{ alignItems: "center", marginTop: "16px" }}>
          <div className="flex-col" style={{ gridColumn: "1 / -1", flexDirection: "row", gap: "8px", marginBottom: "8px", width: "100%" }}>
            <input type="text" className="module-search-input" style={{ flex: 1 }} placeholder="🔍 Buscar por folio, cliente o equipo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="module-search-input" style={{ width: "220px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ArchiveFilter)}>
              <option value="ALL">Todos los registros</option>
              <option value="entregado">Entregados</option>
              <option value="cancelado">Cancelados</option>
              <option value="archivado">Archivados</option>
            </select>
            <input type="date" className="module-search-input" style={{ width: "170px" }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <input type="date" className="module-search-input" style={{ width: "170px" }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <button disabled={loading} className="product-button is-primary" onClick={loadData} style={{ padding: "0 20px", minWidth: "150px" }}>
              {loading ? "Consultando..." : "Aplicar filtros"}
            </button>
          </div>
        </div>
      </div>

      {apiStateError ? <div className="form-message is-error">{apiStateError}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <article className="sdmx-card-premium">
          <span className="hero-eyebrow">Entregadas</span>
          <strong style={{ display: "block", marginTop: "6px", fontSize: "1.8rem", color: "#047857" }}>{archiveStats.entregadas}</strong>
          <p className="muted" style={{ margin: "4px 0 0 0" }}>Servicios cerrados con entrega confirmada.</p>
        </article>
        <article className="sdmx-card-premium">
          <span className="hero-eyebrow">Canceladas</span>
          <strong style={{ display: "block", marginTop: "6px", fontSize: "1.8rem", color: "#dc2626" }}>{archiveStats.canceladas}</strong>
          <p className="muted" style={{ margin: "4px 0 0 0" }}>Casos cerrados sin conversión final.</p>
        </article>
        <article className="sdmx-card-premium">
          <span className="hero-eyebrow">Monto histórico</span>
          <strong style={{ display: "block", marginTop: "6px", fontSize: "1.8rem", color: "#1d4ed8" }}>{formatMoney(archiveStats.historico)}</strong>
          <p className="muted" style={{ margin: "4px 0 0 0" }}>Valor acumulado de los registros visibles.</p>
        </article>
      </div>

      <div className="operativo-grid" style={{ gridTemplateColumns: "1fr" }}>
        <article className="sdmx-card-premium" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: "1px solid rgba(15,23,42,0.08)", paddingBottom: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="flex-col">
              <h3 style={{ fontSize: "1.25rem", margin: 0 }}>Historial de Órdenes</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Mostrando {archived.length} registro(s) en el archivo.</p>
            </div>
          </div>

          <ul className="data-list scrollable-list">
            {archived.length === 0 ? (
              <li className="empty-state">
                <strong>No hay registros para esos filtros</strong>
                <span>Ajusta fechas, estado o búsqueda para encontrar el expediente que necesitas.</span>
              </li>
            ) : (
              archived.map((order) => (
                <li key={order.id} className="list-item-grid" style={{ background: order.status === "cancelado" ? "#fef2f2" : "#f8fafc" }}>
                  <div style={{ background: normalizeArchiveStatus(order.status) === "cancelado" ? "#7f1d1d" : "#0f172a", color: "white", padding: "8px 12px", borderRadius: "8px", fontWeight: "bold", fontSize: "0.9rem" }}>
                    {normalizeArchiveStatus(order.status) === "cancelado" ? "Cancelado" : "Folio"}: {order.folio}
                  </div>
                  <div className="flex-col">
                    <strong style={{ fontSize: "1.05rem", color: "#1e3a8a" }}>{order.customerName || "Venta de mostrador"}</strong>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Equipo o servicio: {order.deviceType} · Última actualización: {formatDate(order.promisedDate)}</span>
                    <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Prioridad original: {(order.priority || "normal").toUpperCase()} · Archivado: {formatDate(order.archivedAt)}</span>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <span className={`badge-${normalizeArchiveStatus(order.status) === "cancelado" ? "danger" : "neutral"}`}>DICTAMEN: {order.status.toUpperCase()}</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "bold", color: normalizeArchiveStatus(order.status) === "cancelado" ? "#ef4444" : "#0f172a" }}>Monto registrado: {formatMoney(order.estimatedCost)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
