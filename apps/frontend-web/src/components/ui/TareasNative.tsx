"use client";

import { FormEvent, useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedUserName?: string;
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
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "No se pudo completar la operación");
  }

  return data as T;
}

export function TareasNative() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pendiente",
    priority: "media",
    dueDate: ""
  });

  async function loadTasks() {
    setLoading(true);
    try {
      const result = await fetchJson<{ data: Task[] }>("/api/tasks");
      setTasks(result.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await fetchJson("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          dueDate: form.dueDate ? new Date(`${form.dueDate}T18:00:00Z`).toISOString() : null
        })
      });
      setForm({
        title: "",
        description: "",
        status: "pendiente",
        priority: "media",
        dueDate: ""
      });
      await loadTasks();
      setMessage("Tarea guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la tarea");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Tareas nativo</span>
          <h1>Seguimiento operativo de tareas</h1>
          <p>Este panel ya registra tareas reales del shop y las enlaza al backend nuevo.</p>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="module-native-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Nueva tarea</h3>
          <label>
            Título
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label>
            Descripción
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label>
            Estado
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>
          <label>
            Prioridad
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>
          <label>
            Fecha límite
            <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </label>
          <button type="submit" disabled={loading}>Guardar tarea</button>
        </form>

        <article className="card">
          <h3>Tareas recientes</h3>
          <ul className="data-list">
            {tasks.length === 0 ? (
              <li>
                <strong>Sin tareas todavía</strong>
                <span>Cuando registres tareas aquí, aparecerán en esta lista.</span>
              </li>
            ) : (
              tasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong>
                  <span>
                    {task.status} · {task.priority}
                    {task.dueDate ? ` · vence ${task.dueDate}` : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
