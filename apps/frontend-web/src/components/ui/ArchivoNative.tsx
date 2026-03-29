"use client";

import { useEffect, useState } from "react";

type ArchivedOrder = {
  id: string;
  folio: string;
  status: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  reportedIssue?: string;
  finalCost: number;
};

type ActiveOrder = {
  id: string;
  folio: string;
  status: string;
  deviceType?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "No se pudo completar la operación");
  return data as T;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0);
}

export function ArchivoNative() {
  const [orders, setOrders] = useState<ArchivedOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [message, setMessage] = useState("");

  async function loadArchive() {
    try {
      const [archiveResult, activeResult] = await Promise.all([
        fetchJson<{ data: ArchivedOrder[] }>("/api/archive/service-orders"),
        fetchJson<{ data: ActiveOrder[] }>("/api/service-orders")
      ]);
      setOrders(archiveResult.data);
      setActiveOrders(
        activeResult.data.filter((item) => !["archivado", "entregado", "cancelado"].includes(item.status))
      );
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar el archivo");
    }
  }

  useEffect(() => {
    void loadArchive();
  }, []);

  async function handleArchive(orderId: string) {
    try {
      await fetchJson(`/api/archive/service-orders/${orderId}`, { method: "POST" });
      await loadArchive();
      setMessage("Orden enviada a archivo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo archivar la orden");
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Archivo nativo</span>
          <h1>Histórico y cierre de órdenes</h1>
          <p>Este panel ya consulta y archiva órdenes cerradas desde el backend nuevo.</p>
        </div>
      </div>
      {message ? <div className="console-message">{message}</div> : null}
      <article className="card">
        <h3>Órdenes archivadas</h3>
        <ul className="data-list">
          {orders.length === 0 ? (
            <li><strong>Sin archivo todavía</strong><span>Cuando archives órdenes cerradas aparecerán aquí.</span></li>
          ) : (
            orders.map((order) => (
              <li key={order.id}>
                <strong>{order.folio} · {order.deviceType || "Equipo"}</strong>
                <span>{order.status} · {formatMoney(order.finalCost)}</span>
              </li>
            ))
          )}
        </ul>
      </article>
      <article className="card">
        <h3>Acción rápida</h3>
        {activeOrders.length === 0 ? (
          <p className="muted">No hay órdenes activas disponibles para archivar desde este panel.</p>
        ) : (
          <ul className="data-list">
            {activeOrders.map((order) => (
              <li key={order.id}>
                <strong>{order.folio} · {order.deviceType || "Equipo"}</strong>
                <span>{order.status}</span>
                <button type="button" className="product-button is-primary" onClick={() => void handleArchive(order.id)}>
                  Archivar
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
