"use client";

import { FormEvent, useEffect, useState } from "react";

type ServiceRequest = {
  id: string;
  folio: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deviceType?: string;
  deviceModel?: string;
  issueDescription?: string;
  urgency?: string;
  status: string;
  quotedTotal: number;
  depositAmount: number;
  balanceAmount: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "No se pudo completar la operación");
  return data as T;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0);
}

export function SolicitudesNative() {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceType: "",
    deviceModel: "",
    issueDescription: "",
    urgency: "normal",
    quotedTotal: "0",
    depositAmount: "0"
  });

  async function loadData() {
    setLoading(true);
    try {
      const result = await fetchJson<{ data: ServiceRequest[] }>("/api/service-requests");
      setItems(result.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const quotedTotal = Number(form.quotedTotal || 0);
      const depositAmount = Number(form.depositAmount || 0);
      await fetchJson("/api/service-requests", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          quotedTotal,
          depositAmount,
          balanceAmount: Math.max(quotedTotal - depositAmount, 0)
        })
      });
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        deviceType: "",
        deviceModel: "",
        issueDescription: "",
        urgency: "normal",
        quotedTotal: "0",
        depositAmount: "0"
      });
      await loadData();
      setMessage("Solicitud guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la solicitud");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Solicitudes nativo</span>
          <h1>Solicitudes y cotizaciones</h1>
          <p>Este panel ya registra solicitudes reales y controla anticipo, saldo y cotización.</p>
        </div>
      </div>
      {message ? <div className="console-message">{message}</div> : null}
      <div className="module-native-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Nueva solicitud</h3>
          <label>Cliente<input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
          <label>WhatsApp<input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></label>
          <label>Email<input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></label>
          <label>Tipo de equipo<input value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} /></label>
          <label>Modelo<input value={form.deviceModel} onChange={(e) => setForm({ ...form, deviceModel: e.target.value })} /></label>
          <label>Falla reportada<textarea value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} /></label>
          <label>Urgencia<select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label>
          <label>Cotización<input type="number" min="0" step="0.01" value={form.quotedTotal} onChange={(e) => setForm({ ...form, quotedTotal: e.target.value })} /></label>
          <label>Anticipo<input type="number" min="0" step="0.01" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} /></label>
          <button type="submit" disabled={loading}>Guardar solicitud</button>
        </form>
        <article className="card">
          <h3>Solicitudes recientes</h3>
          <ul className="data-list">
            {items.length === 0 ? (
              <li><strong>Sin solicitudes todavía</strong><span>La primera cotización nueva aparecerá aquí.</span></li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <strong>{item.folio} · {item.customerName}</strong>
                  <span>{item.deviceType || "Sin equipo"} · {item.status} · {formatMoney(item.balanceAmount)}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
