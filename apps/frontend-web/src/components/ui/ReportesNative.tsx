"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthGuard";
import { FeatureGuard } from "./FeatureGuard";
import { PlanLevel } from "../../lib/subscription";
import { fetchWithAuth } from "../../lib/apiClient";

type ReportRange = "7d" | "30d" | "90d";

type ReportData = {
  ordersTotal: number; ordersOpen: number; ordersDelivered: number;
  tasksOpen: number; tasksUrgent: number; estimatedRevenue: number;
  criticalStock: Array<{ sku: string; name: string; minimumStock: number; stockCurrent: number }>;
  commonIssues: Array<{ issue: string; total: number }>;
  averagePerOrder: number;
  completionRate: number;
  totalDevicesInFlow: number;
};

export function ReportesNative() {
  const { session } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<ReportRange>("30d");

  const rangeOptions: Array<{ value: ReportRange; label: string }> = [
    { value: "7d", label: "7 días" },
    { value: "30d", label: "30 días" },
    { value: "90d", label: "90 días" }
  ];

  async function rawLoad() {
    if (!session?.shop.id) return;
    setLoading(true);
    try {
      const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const response = await fetchWithAuth<ReportData>(`/api/reports/operational?rangeDays=${rangeDays}`);
      const payload = await response.json();
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "No se pudo generar el reporte operativo.");
      }

      const remote = payload.data as any;
      setData({
        ordersTotal: Number(remote.ordersTotal || 0),
        ordersOpen: Number(remote.ordersOpen || 0),
        ordersDelivered: Number(remote.ordersDelivered || 0),
        tasksOpen: Number(remote.tasksOpen || 0),
        tasksUrgent: Number(remote.tasksUrgent || 0),
        estimatedRevenue: Number(remote.estimatedRevenue || 0),
        criticalStock: Array.isArray(remote.criticalStock)
          ? remote.criticalStock.map((item: any) => ({
              sku: item.sku,
              name: item.name,
              minimumStock: Number(item.minimumStock || 0),
              stockCurrent: Number(item.stockCurrent || 0),
            }))
          : [],
        commonIssues: Array.isArray(remote.commonIssues)
          ? remote.commonIssues.map((item: any) => ({
              issue: item.issue,
              total: Number(item.total || 0),
            }))
          : [],
        averagePerOrder: Number(remote.averagePerOrder || 0),
        completionRate: Number(remote.completionRate || 0),
        totalDevicesInFlow: Number(remote.totalDevicesInFlow || 0)
      });

    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (session) void rawLoad(); 
  }, [session, range]);

  function formatMoney(v: number) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v); }

  const reportSignals = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: "Conversión operativa",
        value: `${data.completionRate}%`,
        message: data.completionRate >= 60
          ? "Buen ritmo de salida. El taller está liberando equipos con constancia."
          : "La conversión a entregados sigue baja; conviene revisar cuellos de diagnóstico o compras."
      },
      {
        title: "Ticket por orden",
        value: formatMoney(data.averagePerOrder),
        message: "Sirve para comparar si el volumen de trabajo se está traduciendo en valor promedio suficiente."
      },
      {
        title: "Dispositivos en flujo",
        value: `${data.totalDevicesInFlow}`,
        message: "Mide la carga operativa observada dentro del periodo seleccionado."
      }
    ];
  }, [data]);

  return (
    <FeatureGuard requiredLevel={PlanLevel.AVANZADO} featureName="Reportes Operativos">
      <section className="operativo-shell">
        <div className="operativo-header">
          <div className="flex-col">
            <span className="hero-eyebrow">Métricas</span>
            <h1>Reporte Operativo</h1>
            <p className="muted">Resumen en tiempo real de la operación de servicio.</p>
          </div>
          <div className="module-native-actions flex-row-between" style={{flex: 1, justifyContent: 'flex-end', gap: '12px'}}>
             <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`product-button ${range === option.value ? "is-primary" : ""}`}
                  onClick={() => setRange(option.value)}
                  style={{ minWidth: "92px" }}
                >
                  {option.label}
                </button>
              ))}
             </div>
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

          <div className="grid-cols-3">
            {reportSignals.map((signal) => (
              <div key={signal.title} className="sdmx-card-premium" style={{padding: '20px'}}>
                <span className="hero-eyebrow">{signal.title}</span>
                <strong style={{display: 'block', fontSize: '1.8rem', margin: '8px 0 6px 0', color: '#0f172a'}}>{signal.value}</strong>
                <p className="muted" style={{margin: 0, lineHeight: 1.5}}>{signal.message}</p>
              </div>
            ))}
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
                          <span className="badge-warning">{issue.total} caso(s)</span>
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
    </FeatureGuard>
  );
}
