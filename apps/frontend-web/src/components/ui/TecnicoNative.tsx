"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";

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
  createdAt: string;
  casoResolucionTecnica?: string;
};

type TechTask = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
};

import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthGuard";

export function TecnicoNative() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<TechOrder[]>([]);
  const [tasks, setTasks] = useState<TechTask[]>([]);
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [resolucion, setResolucion] = useState("");
  const [status, setStatus] = useState("diagnostico");
  const [finalCost, setFinalCost] = useState("0");

  async function loadQueue() {
    if (!session?.shop.id) return;
    
    try {
      // 1. Fetch Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', session.shop.id)
        .in('status', ['diagnostico', 'reparacion', 'espera_refaccion', 'listo'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Map DB fields to TechOrder type
      const mappedOrders: TechOrder[] = ordersData.map((o: any) => ({
        id: o.id,
        folio: o.folio,
        status: o.status,
        deviceType: o.device_type,
        deviceBrand: o.device_brand,
        deviceModel: o.device_model,
        reportedIssue: o.reported_issue,
        internalDiagnosis: o.internal_diagnosis,
        casoResolucionTecnica: o.caso_resolucion_tecnica,
        finalCost: Number(o.final_cost || 0),
        createdAt: o.created_at
      }));

      setOrders(mappedOrders);

      // 2. Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', session.shop.id)
        .eq('status', 'pendiente')
        .limit(10);

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      setMessage("");
    } catch (error: any) {
      setMessage(error.message || "No se pudo cargar la cola técnica");
    }
  }

  useEffect(() => {
    if (session) void loadQueue();
  }, [session]);

  // Seleccionar orden y precargar datos
  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find(o => o.id === selectedOrderId);
      if (order) {
        setDiagnosis(order.internalDiagnosis || "");
        setResolucion(order.casoResolucionTecnica || "");
        setStatus(order.status || "diagnostico");
        setFinalCost(String(order.finalCost || 0));
      }
    }
  }, [selectedOrderId, orders]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrderId) {
      setMessage("Selecciona una orden para actualizar.");
      return;
    }
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          status,
          internal_diagnosis: diagnosis,
          caso_resolucion_tecnica: resolucion,
          final_cost: Number(finalCost || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrderId)
        .eq('tenant_id', session?.shop.id);

      if (error) throw error;

      setMessage("Orden técnica actualizada exitosamente.");
      await loadQueue();
    } catch (error: any) {
      setMessage(error.message || "No se pudo actualizar la orden");
    }
  }

  const isMoreThan48h = (dateStr: string) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours > 48;
  };

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Técnico nativo</span>
          <h1>Cola de trabajo técnica</h1>
          <p>Gestiona diagnósticos, reparaciones y resoluciones finales.</p>
        </div>
      </div>
      
      {message ? <div className={`console-message ${message.includes('Error') ? 'error' : ''}`} style={{background: message.includes('exitosamente') ? '#ecfdf5' : '#f8fafc', color: message.includes('exitosamente') ? '#059669' : '#0f172a', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontWeight: 600}}>{message}</div> : null}

      <div className="module-native-grid">
        <form className="sdmx-card-premium" onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: 800}}>Actualizar orden</h3>
          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
            Seleccionar Orden
            <select style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}} value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
              <option value="">-- Elige un equipo --</option>
              {orders.map((order) => <option key={order.id} value={order.id}>{order.folio} · {order.deviceType || "Equipo"}</option>)}
            </select>
          </label>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
              Estatus técnico
              <select style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="diagnostico">Diagnóstico</option>
                <option value="reparacion">Reparación</option>
                <option value="espera_refaccion">Espera Refacción</option>
                <option value="listo">Listo para Entrega</option>
              </select>
            </label>
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
              Costo final (MXN)
              <input type="number" min="0" step="0.01" style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}} value={finalCost} onChange={(e) => setFinalCost(e.target.value)} />
            </label>
          </div>

          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
            Bitácora de Seguimiento (Interno)
            <textarea style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minHeight: '80px'}} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="¿Qué se le ha hecho al equipo?" />
          </label>

          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700}}>
            Resolución del Caso (Visible en PDF Cliente)
            <textarea style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minHeight: '80px', background: '#f8fafc'}} value={resolucion} onChange={(e) => setResolucion(e.target.value)} placeholder="Ej. Cambio de centro de carga y limpieza profunda." />
          </label>

          <button type="submit" className="sdmx-btn-primary" style={{marginTop: '0.5rem'}}>Guardar Avance Técnico</button>
        </form>

        <article className="sdmx-card-premium">
          <h3 style={{margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 800}}>Órdenes activas</h3>
          <ul className="data-list" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            {orders.length === 0 ? (
              <li style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>Sin órdenes técnicas pendientes.</li>
            ) : (
              orders.map((order) => {
                const delayed = isMoreThan48h(order.createdAt) && order.status !== 'listo';
                return (
                  <li key={order.id} style={{
                    padding: '1rem', 
                    borderRadius: '0.75rem', 
                    border: delayed ? '2px solid #ef4444' : '1px solid #f1f5f9', 
                    background: delayed ? '#fef2f2' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    position: 'relative'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <strong style={{fontSize: '0.875rem', color: '#0f172a'}}>{order.folio} · {order.deviceType || "Equipo"}</strong>
                      <span className={`sdmx-badge ${order.status === 'listo' ? 'sdmx-badge-emerald' : 'sdmx-badge-amber'}`}>{order.status}</span>
                    </div>
                    <span style={{fontSize: '0.75rem', color: '#64748b'}}>{order.reportedIssue || "Sin falla capturada"}</span>
                    {delayed && (
                      <span style={{fontSize: '0.625rem', fontWeight: 900, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem'}}>
                        ⚠️ SIN AVANCE (+48H)
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </article>

        <article className="sdmx-card-premium">
          <h3 style={{margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 800}}>Tareas del Taller</h3>
          <ul className="data-list" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            {tasks.length === 0 ? (
              <li style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>No hay tareas asignadas.</li>
            ) : (
              tasks.map((task) => (
                <li key={task.id} style={{padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9', background: 'white'}}>
                  <strong style={{fontSize: '0.875rem', color: '#0f172a', display: 'block'}}>{task.title}</strong>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem'}}>
                     <span style={{fontSize: '0.75rem', color: '#64748b'}}>{task.status}</span>
                     <span style={{fontSize: '0.75rem', fontWeight: 600, color: task.priority === 'alta' ? '#ef4444' : '#3b82f6'}}>{task.priority}</span>
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
