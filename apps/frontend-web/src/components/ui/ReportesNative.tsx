"use client";

import { useEffect, useState } from "react";

type OperationalReport = {
  ordersTotal: number;
  ordersOpen: number;
  ordersDelivered: number;
  tasksOpen: number;
  tasksUrgent: number;
  estimatedRevenue: number;
  criticalStock: Array<{ sku: string; name: string; minimumStock: number; stockCurrent: number }>;
  commonIssues: Array<{ issue: string; total: number }>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "No se pudo completar la operación");
  }

  return data as T;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function ReportesNative() {
  const [report, setReport] = useState<OperationalReport | null>(null);
  const [message, setMessage] = useState("");

  async function loadReport() {
    try {
      const result = await fetchJson<{ data: OperationalReport }>("/api/reports/operational");
      setReport(result.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar el reporte");
    }
  }

  useEffect(() => {
    void loadReport();
  }, []);

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Reportes nativo</span>
          <h1>Reporte operativo consolidado</h1>
          <p>Este panel resume órdenes, tareas, ingresos estimados y alertas de stock del shop.</p>
        </div>
        <div className="module-native-actions">
          <button type="button" className="product-button is-primary" onClick={() => void loadReport()}>
            Refrescar reporte
          </button>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="operativo-summary">
        <article className="summary-card"><span>Órdenes totales</span><strong>{report?.ordersTotal ?? 0}</strong></article>
        <article className="summary-card"><span>Órdenes abiertas</span><strong>{report?.ordersOpen ?? 0}</strong></article>
        <article className="summary-card"><span>Tareas urgentes</span><strong>{report?.tasksUrgent ?? 0}</strong></article>
        <article className="summary-card"><span>Ingreso estimado</span><strong>{formatMoney(report?.estimatedRevenue ?? 0)}</strong></article>
      </div>

      <div className="module-native-grid">
        <article className="card">
          <h3>Incidencias frecuentes</h3>
          <ul className="data-list">
            {(report?.commonIssues ?? []).length === 0 ? (
              <li>
                <strong>Sin datos todavía</strong>
                <span>Conforme ingresen órdenes, aquí verás las fallas más repetidas.</span>
              </li>
            ) : (
              report!.commonIssues.map((issue) => (
                <li key={issue.issue}>
                  <strong>{issue.issue}</strong>
                  <span>{issue.total} caso(s)</span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="card">
          <h3>Stock crítico</h3>
          <ul className="data-list">
            {(report?.criticalStock ?? []).length === 0 ? (
              <li>
                <strong>Sin alertas</strong>
                <span>No hay productos críticos en la sucursal activa.</span>
              </li>
            ) : (
              report!.criticalStock.map((item) => (
                <li key={item.sku}>
                  <strong>{item.sku} · {item.name}</strong>
                  <span>Actual {item.stockCurrent} · mínimo {item.minimumStock}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
