"use client";

import { useEffect, useState } from "react";

type FinanceSummary = {
  projectedRevenue: number;
  expenseTotal: number;
  purchaseCommitted: number;
  netProjected: number;
  activeOrders: number;
  customers: number;
  averageTicket: number;
  monthlyRevenue: Array<{ label: string; revenue: number }>;
  monthlyExpenses: Array<{ label: string; expenses: number }>;
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

export function FinanzasNative() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [message, setMessage] = useState("");

  async function loadSummary() {
    try {
      const result = await fetchJson<{ data: FinanceSummary }>("/api/finance/summary");
      setSummary(result.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar finanzas");
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Finanzas nativo</span>
          <h1>Resumen financiero del shop</h1>
          <p>Este panel consolida ingresos proyectados, compras y gastos desde el backend nuevo.</p>
        </div>
        <div className="module-native-actions">
          <button type="button" className="product-button is-primary" onClick={() => void loadSummary()}>
            Refrescar resumen
          </button>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="operativo-summary">
        <article className="summary-card">
          <span>Ingreso proyectado</span>
          <strong>{formatMoney(summary?.projectedRevenue ?? 0)}</strong>
        </article>
        <article className="summary-card">
          <span>Gastos</span>
          <strong>{formatMoney(summary?.expenseTotal ?? 0)}</strong>
        </article>
        <article className="summary-card">
          <span>Compras comprometidas</span>
          <strong>{formatMoney(summary?.purchaseCommitted ?? 0)}</strong>
        </article>
        <article className="summary-card">
          <span>Neto proyectado</span>
          <strong>{formatMoney(summary?.netProjected ?? 0)}</strong>
        </article>
      </div>

      <div className="module-native-grid">
        <article className="card">
          <h3>Indicadores</h3>
          <ul className="data-list">
            <li><strong>Órdenes activas</strong><span>{summary?.activeOrders ?? 0}</span></li>
            <li><strong>Clientes</strong><span>{summary?.customers ?? 0}</span></li>
            <li><strong>Ticket promedio</strong><span>{formatMoney(summary?.averageTicket ?? 0)}</span></li>
          </ul>
        </article>

        <article className="card">
          <h3>Últimos meses</h3>
          <ul className="data-list">
            {(summary?.monthlyRevenue ?? []).length === 0 && (summary?.monthlyExpenses ?? []).length === 0 ? (
              <li>
                <strong>Sin datos todavía</strong>
                <span>Conforme captures órdenes y gastos, aquí verás la tendencia.</span>
              </li>
            ) : (
              (summary?.monthlyRevenue ?? []).map((item) => {
                const expenseMatch = summary?.monthlyExpenses.find((expense) => expense.label === item.label);
                return (
                  <li key={item.label}>
                    <strong>{item.label}</strong>
                    <span>
                      Ingreso {formatMoney(item.revenue)} · Gasto {formatMoney(expenseMatch?.expenses ?? 0)}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
