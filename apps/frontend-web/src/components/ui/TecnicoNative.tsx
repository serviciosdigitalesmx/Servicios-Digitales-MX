"use client";

import { FormEvent, useEffect, useState } from "react";

type TechOrder = {
  id: string;
  folio: string;
  status: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  reportedIssue?: string;
  internalDiagnosis?: string;
  finalCost: number;
  priority?: string;
};

type TechTask = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
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

export function TecnicoNative() {
  const [orders, setOrders] = useState<TechOrder[]>([]);
  const [tasks, setTasks] = useState<TechTask[]>([]);
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [status, setStatus] = useState("diagnostico");
  const [finalCost, setFinalCost] = useState("0");

  async function loadQueue() {
    try {
      const result = await fetchJson<{ data: { orders: TechOrder[]; tasks: TechTask[] } }>("/api/technician/queue");
      setOrders(result.data.orders);
      setTasks(result.data.tasks);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar la cola técnica");
    }
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrderId) {
      setMessage("Selecciona una orden para actualizar.");
      return;
    }
    try {
      await fetchJson(`/api/service-orders/${selectedOrderId}/technician`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          internalDiagnosis: diagnosis,
          finalCost: Number(finalCost || 0)
        })
      });
      setDiagnosis("");
      setStatus("diagnostico");
      setFinalCost("0");
      await loadQueue();
      setMessage("Orden técnica actualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la orden");
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Técnico nativo</span>
          <h1>Cola de trabajo técnica</h1>
          <p>Este panel ya trabaja con órdenes reales para diagnóstico, reparación y cierre.</p>
        </div>
      </div>
      {message ? <div className="console-message">{message}</div> : null}
      <div className="module-native-grid">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <h3>Actualizar orden</h3>
          <label>
            Orden
            <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
              <option value="">Selecciona una orden</option>
              {orders.map((order) => <option key={order.id} value={order.id}>{order.folio} · {order.deviceType || "Equipo"}</option>)}
            </select>
          </label>
          <label>
            Estatus técnico
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="diagnostico">Diagnóstico</option>
              <option value="reparacion">Reparación</option>
              <option value="listo">Listo</option>
            </select>
          </label>
          <label>Diagnóstico interno<textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} /></label>
          <label>Costo final<input type="number" min="0" step="0.01" value={finalCost} onChange={(e) => setFinalCost(e.target.value)} /></label>
          <button type="submit">Guardar avance</button>
        </form>
        <article className="sdmx-card-premium">
          <h3>Órdenes activas</h3>
          <ul className="data-list">
            {orders.length === 0 ? (
              <li><strong>Sin órdenes técnicas</strong><span>Cuando entren equipos a diagnóstico o reparación aparecerán aquí.</span></li>
            ) : (
              orders.map((order) => (
                <li key={order.id}>
                  <strong>{order.folio} · {order.deviceType || "Equipo"}</strong>
                  <span>{order.status} · {order.reportedIssue || "Sin falla capturada"}</span>
                </li>
              ))
            )}
          </ul>
        </article>
        <article className="sdmx-card-premium">
          <h3>Tareas abiertas</h3>
          <ul className="data-list">
            {tasks.length === 0 ? (
              <li><strong>Sin tareas abiertas</strong><span>Las tareas operativas del técnico aparecerán aquí.</span></li>
            ) : (
              tasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong>
                  <span>{task.status} · {task.priority}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
