"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/apiClient";

type ReportData = {
  ordersTotal: number; ordersOpen: number; ordersDelivered: number;
  tasksOpen: number; tasksUrgent: number; estimatedRevenue: number;
  criticalStock: Array<{ sku: string; name: string; minimumStock: number; stockCurrent: number }>;
  commonIssues: Array<{ issue: string; total: number }>;
};
import { useAuth } from "./AuthGuard";

export function ReportesNative() {
  const { session } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  async function rawLoad() {
    if (!session?.shop.id) return;
    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/reports/operational");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Error al cargar el reporte operativo.");
      }

      const report = payload?.data;
      setData({
        ordersTotal: Number(report?.ordersTotal || 0),
        ordersOpen: Number(report?.ordersOpen || 0),
        ordersDelivered: Number(report?.ordersDelivered || 0),
        tasksOpen: Number(report?.tasksOpen || 0),
        tasksUrgent: Number(report?.tasksUrgent || 0),
        estimatedRevenue: Number(report?.estimatedRevenue || 0),
        criticalStock: Array.isArray(report?.criticalStock) ? report.criticalStock.map((item: any) => ({
          sku: item.sku,
          name: item.name,
          minimumStock: Number(item.minimumStock || 0),
          stockCurrent: Number(item.stockCurrent || 0)
        })) : [],
        commonIssues: Array.isArray(report?.commonIssues) ? report.commonIssues.map((item: any) => ({
          issue: item.issue,
          total: Number(item.total || 0)
        })) : []
      });

    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (session) void rawLoad(); 
  }, [session]);

  function formatMoney(v: number) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v); }

  return (
    <section className="operativo-shell">
      <div className="operativo-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Métricas</span>
          <h1>Reporte Operativo</h1>
          <p className="muted">Resumen en tiempo real de la operación de servicio.</p>
        </div>
        <div className="module-native-actions flex-row-between" style={{flex: 1, justifyContent: 'flex-end', gap: '12px'}}>
           <button disabled={loading} className="product-button is-primary" onClick={rawLoad} style={{padding: '0 20px', minWidth: '150px'}}>{loading ? 'Cargando...' : 'Actualizar Datos'}</button>
        </div>
      </div>

      <div className="operativo-grid" style={{gridTemplateColumns: '1fr', gap: '20px'}}>
         
        {/* KPI Row */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px'}}>
           <div className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center'}}>
               <span style={{color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold'}}>Ingresos Estimados</span>
               <strong style={{fontSize: '2.5rem', color: '#10b981', lineHeight: '1'}}>{data ? formatMoney(data.estimatedRevenue) : "$0"}</strong>
               <span style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px'}}>Ingreso potencial</span>
           </div>
           <div className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center'}}>
               <span style={{color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold'}}>Órdenes Abiertas</span>
               <strong style={{fontSize: '2.5rem', color: '#1e3a8a', lineHeight: '1'}}>{data?.ordersOpen || "0"}</strong>
               <span style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px'}}>Activas actualmente</span>
           </div>
           <div className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center'}}>
               <span style={{color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold'}}>Tareas Urgentes</span>
               <strong style={{fontSize: '2.5rem', color: '#f59e0b', lineHeight: '1'}}>{data?.tasksUrgent || "0"}</strong>
               <span style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px'}}>Requieren atención</span>
           </div>
           <div className="sdmx-card-premium" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center'}}>
               <span style={{color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold'}}>Órdenes Entregadas</span>
               <strong style={{fontSize: '2.5rem', color: '#0f172a', lineHeight: '1'}}>{data?.ordersDelivered || "0"}</strong>
               <span style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px'}}>Equipos devueltos</span>
           </div>
        </div>

        {/* Breakdown Row */}
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '16px'}}>
           <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
              <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
                 <h3 style={{fontSize: '1.25rem', margin: 0}}>Fallas Comunes</h3>
                 <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>Problemas frecuentes reportados por los clientes.</p>
              </div>
              <ul className="data-list scrollable-list">
                 {!data || data.commonIssues.length === 0 ? <li className="empty-state"><strong>Sin incidencias comunes</strong></li> :
                   data.commonIssues.map((issue, idx) => (
                     <li key={idx} className="flex-row-between">
                        <strong style={{color: '#0f172a'}}>{issue.issue}</strong>
                        <span className="badge-warning">{issue.total} Casos idénticos</span>
                     </li>
                   ))
                 }
              </ul>
           </article>

           <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
              <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
                 <h3 style={{fontSize: '1.25rem', margin: 0}}>Inventario Bajo</h3>
                 <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>Productos con stock por debajo del mínimo establecido.</p>
              </div>
              <ul className="data-list scrollable-list">
                 {!data || data.criticalStock.length === 0 ? <li className="empty-state"><strong>Inventario saludable</strong></li> :
                   data.criticalStock.map((s) => (
                     <li key={s.sku} className="flex-row-between">
                        <div className="flex-col">
                           <strong style={{color: '#0f172a', fontSize: '1.05rem'}}>SKU: {s.sku}</strong>
                           <span style={{color: '#64748b', fontSize: '0.85rem'}}>{s.name}</span>
                        </div>
                        <div className="flex-col" style={{alignItems: 'flex-end', textAlign: 'right'}}>
                           <span className="badge-danger">Restan {s.stockCurrent} pzas</span>
                           <span style={{color: '#94a3b8', fontSize: '0.75rem'}}>Piso Mínimo {s.minimumStock}</span>
                        </div>
                     </li>
                   ))
                 }
              </ul>
           </article>
        </div>

      </div>
    </section>
  );
}
