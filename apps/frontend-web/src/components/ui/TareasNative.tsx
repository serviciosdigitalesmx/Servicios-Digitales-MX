"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/apiClient";
import { useAuth } from "./AuthGuard";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedUserName?: string;
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr));
}

export function TareasNative() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pendiente",
    priority: "media",
    dueDate: ""
  });

  async function loadTasks() {
    if (!session?.shop.id) return;
    setLoading(true);
    setApiStateMessage("");
    setApiStateError("");
    try {
      const response = await fetchWithAuth("/api/tasks?page=1&pageSize=100");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Error al cargar las tareas.");
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      setTasks(
        data.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description ?? undefined,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ?? undefined,
          assignedUserName: task.assignedUserName ?? undefined
        }))
      );
    } catch (error: unknown) {
      setApiStateError(error instanceof Error ? error.message : "Error al cargar las tareas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void loadTasks();
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setApiStateMessage("");
    setApiStateError("");

    if (!form.title.trim()) {
      setFormError("⚠️ El título de la tarea es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          status: form.status,
          priority: form.priority,
          dueDate: form.dueDate ? new Date(`${form.dueDate}T18:00:00Z`).toISOString() : null,
          assignedUserId: null,
          branchId: session?.user.branchId || null,
          serviceOrderId: null,
          serviceRequestId: null
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Error al guardar la tarea.");
      }

      setForm({
        title: "",
        description: "",
        status: "pendiente",
        priority: "media",
        dueDate: ""
      });
      await loadTasks();
      setApiStateMessage("✅ Tarea asignada exitosamente.");
    } catch (error: unknown) {
      setApiStateError(error instanceof Error ? error.message : "Error al guardar la tarea.");
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter(
    (task) => !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase()) || (task.assignedUserName && task.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Tareas</span>
          <h1>Seguimiento interno del equipo</h1>
          <p>Organiza pendientes, responsables y fechas clave para que nada importante se quede sin seguimiento.</p>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="console-message is-warning">{apiStateError}</div>}

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <h3>Nueva tarea interna</h3>
          {formError && <div className="form-message is-warning">{formError}</div>}

          <label>Título *
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Realizar corte de caja adelantado" />
          </label>
          <label>Descripción
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Contexto, siguiente paso o advertencias para el equipo..." />
          </label>

          <div className="grid-cols-2">
            <label>Estado
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="completada">Resuelta</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>
            <label>Prioridad
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </label>
          </div>
          <label>Fecha compromiso
            <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </label>
          <button type="submit" disabled={loading}>Guardar tarea</button>
        </form>

        <article className="sdmx-card-premium" style={{ display: "flex", flexDirection: "column" }}>
          <div className="flex-row-between">
            <div className="flex-col">
              <h3 style={{ margin: 0 }}>Bandeja de pendientes</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{filteredTasks.length} tarea(s) visibles.</p>
            </div>
            <input type="text" className="module-search-input" style={{ width: "260px", padding: "8px 12px", fontSize: "0.85rem" }} placeholder="Buscar por título o responsable..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <ul className="data-list scrollable-list">
            {filteredTasks.length === 0 ? (
              <li className="empty-state">
                <strong>No hay tareas para mostrar.</strong>
                <span>Crea una tarea nueva o ajusta la búsqueda para encontrar un pendiente existente.</span>
              </li>
            ) : (
              filteredTasks.map((task) => (
                <li key={task.id} className="list-item-grid">
                  <div style={{ background: task.priority === "urgente" ? "#ef4444" : task.priority === "alta" ? "#f59e0b" : "#334155", color: "white", padding: "6px 14px", borderRadius: "8px", fontWeight: "bold", fontSize: "0.85rem" }}>
                    {task.priority.toUpperCase()}
                  </div>
                  <div className="flex-col">
                    <strong style={{ fontSize: "1.05rem", color: "#0f172a", textDecoration: task.status === "completada" ? "line-through" : "none" }}>{task.title}</strong>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Estado: <strong>{task.status}</strong>
                      {task.dueDate ? ` · Compromiso: ${formatDate(task.dueDate)}` : ""}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {task.assignedUserName && (
                      <span style={{ color: "#1e3a8a", backgroundColor: "rgba(30,58,138,0.06)", padding: "6px 14px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold" }}>
                        Responsable: {task.assignedUserName}
                      </span>
                    )}
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
