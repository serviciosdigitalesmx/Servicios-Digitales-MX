"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthGuard";
import { FeatureGuard } from "./FeatureGuard";
import { PlanLevel } from "../../lib/subscription";

type ReportData = {
  ordersTotal: number; ordersOpen: number; ordersDelivered: number;
  tasksOpen: number; tasksUrgent: number; estimatedRevenue: number;
  criticalStock: Array<{ sku: string; name: string; minimumStock: number; stockCurrent: number }>;
  commonIssues: Array<{ issue: string; total: number }>;
};

export function ReportesNative() {
  const { session } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  async function rawLoad() {
    if (!session?.shop.id) return;
    setLoading(true);
    try {
      const [ordersRes, tasksRes, productsRes] = await Promise.all([
        supabase.from('service_orders').select('status, estimated_cost, final_cost').eq('tenant_id', session.shop.id),
        supabase.from('tasks').select('status, priority').eq('tenant_id', session.shop.id),
        supabase.from('products').select('sku, name, stock_min, stock_current').eq('tenant_id', session.shop.id).eq('is_active', true)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (productsRes.error) throw productsRes.error;

      const products = productsRes.data || [];
      const criticalStock = products.filter((p: any) => (p.stock_current || 0) < (p.stock_min || 0));

      const orders = ordersRes.data || [];
      const tasks = tasksRes.data || [];
      
      const ordersOpen = orders.filter((o: any) => !['entregado', 'cancelado', 'archivado'].includes(o.status)).length;
      const ordersDelivered = orders.filter((o: any) => o.status === 'entregado').length;
      const revenue = orders.reduce((acc: number, o: any) => acc + (Number(o.final_cost || o.estimated_cost || 0)), 0);

      const tasksOpen = tasks.filter((t: any) => t.status === 'pendiente').length;
      const tasksUrgent = tasks.filter((t: any) => t.priority === 'urgente' && t.status === 'pendiente').length;

      setData({
        ordersTotal: orders.length,
        ordersOpen,
        ordersDelivered,
        tasksOpen,
        tasksUrgent,
        estimatedRevenue: revenue,
        criticalStock: criticalStock.map((p: any) => ({
          sku: p.sku,
          name: p.name,
          minimumStock: p.stock_min,
          stockCurrent: p.stock_current
        })),
        commonIssues: []
      });

    } catch (error: any) {
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
    <FeatureGuard requiredLevel={PlanLevel.AVANZADO} featureName="Reportes Operativos">
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
    </FeatureGuard>
  );
}
