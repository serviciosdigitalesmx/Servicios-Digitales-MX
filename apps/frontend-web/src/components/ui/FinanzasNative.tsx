"use client";

import { useEffect, useState } from "react";
import { IconMoneyUp, IconMoneyDown, IconReceipt, IconVault, IconChart, IconSync, IconDownload, IconWarning } from "./Icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthGuard";
import { FeatureGuard } from "./FeatureGuard";
import { PlanLevel } from "../../lib/subscription";

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0);
}

export function FinanzasNative() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSummary() {
    if (!session?.shop.id) return;
    setLoading(true);
    setApiStateMessage("");
    setApiStateError("");
    try {
      // Aggregate data from Supabase
      const [ordersRes, expensesRes, purchaseRes, customersRes] = await Promise.all([
        supabase.from('service_orders').select('final_cost, estimated_cost, status').eq('tenant_id', session.shop.id),
        supabase.from('expenses').select('amount').eq('tenant_id', session.shop.id),
        supabase.from('purchase_orders').select('total_amount, status').eq('tenant_id', session.shop.id).neq('status', 'cancelled'),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', session.shop.id)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (purchaseRes.error) throw purchaseRes.error;
      if (customersRes.error) throw customersRes.error;

      const revenue = ordersRes.data.reduce((acc: number, o: any) => acc + (Number(o.final_cost || o.estimated_cost || 0)), 0);
      const expenses = expensesRes.data.reduce((acc: number, e: any) => acc + (Number(e.amount || 0)), 0);
      const committed = purchaseRes.data.reduce((acc: number, p: any) => acc + (Number(p.total_amount || 0)), 0);
      const activeOrders = ordersRes.data.filter((o: any) => !['entregado', 'cancelado'].includes(o.status)).length;

      setSummary({
        projectedRevenue: revenue,
        expenseTotal: expenses,
        purchaseCommitted: committed,
        netProjected: revenue - expenses - committed,
        activeOrders,
        customers: customersRes.count || 0,
        averageTicket: revenue / (ordersRes.data.length || 1),
        monthlyRevenue: [],
        monthlyExpenses: []
      });

    } catch (error: any) {
       setApiStateError(error.message || "Error al obtener el consolidado.");
    } finally {
       setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void loadSummary();
  }, [session]);

  return (
    <FeatureGuard requiredLevel={PlanLevel.INTEGRAL} featureName="Flujo de Caja">
      <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
        
        {/* HEADER */}
        <div className="finanzas-header">
           <div>
              <h1>Finanzas</h1>
              <p>Resumen unificado de ingresos, egresos y flujo de operación.</p>
           </div>
           <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
             {loading && <span style={{fontSize: '0.875rem', color: '#64748b'}}><IconSync style={{marginRight: '0.5rem', width: '16px', height: '16px', animation: 'sdmx-spin 1s linear infinite', display: 'inline-block'}} />Cargando...</span>}
             <button onClick={() => void loadSummary()} className="sdmx-btn-primary" disabled={loading}>
                <IconSync style={{width:'16px', height:'16px'}} />
                Actualizar
             </button>
             <button className="sdmx-btn-ghost">
                <IconDownload style={{width:'16px', height:'16px'}} />
                Exportar
             </button>
           </div>
        </div>

        {apiStateMessage && <div style={{padding: '1rem', background: '#ecfdf5', color: '#059669', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>{apiStateMessage}</div>}
        {apiStateError && <div style={{padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', display:'flex', alignItems:'center', gap:'0.5rem'}}><IconWarning style={{width:'16px', height:'16px'}}/> {apiStateError}</div>}

        {/* PRIMARY KPI GRID */}
        <div className="finanzas-kpi-grid">
           <div className="finanzas-kpi-box" style={{borderLeft: '4px solid #3b82f6'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                 <span className="finanzas-kpi-label">Ingresos</span>
                 <div style={{background: '#eff6ff', color: '#3b82f6', width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <IconMoneyUp style={{width:'20px', height:'20px'}} />
                 </div>
              </div>
              <p className="finanzas-kpi-val">{formatMoney(summary?.projectedRevenue ?? 0)}</p>
              <p style={{fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 500}}>Total bruto</p>
           </div>

           <div className="finanzas-kpi-box" style={{borderLeft: '4px solid #ef4444'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                 <span className="finanzas-kpi-label">Egresos</span>
                 <div style={{background: '#fef2f2', color: '#ef4444', width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <IconMoneyDown style={{width:'20px', height:'20px'}} />
                 </div>
              </div>
              <p className="finanzas-kpi-val">{formatMoney(summary?.expenseTotal ?? 0)}</p>
              <p style={{fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 500}}>Total salidas</p>
           </div>

           <div className="finanzas-kpi-box" style={{borderLeft: '4px solid #f59e0b'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                 <span className="finanzas-kpi-label">Por Pagar</span>
                 <div style={{background: '#fffbeb', color: '#f59e0b', width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <IconReceipt style={{width:'20px', height:'20px'}} />
                 </div>
              </div>
              <p className="finanzas-kpi-val">{formatMoney(summary?.purchaseCommitted ?? 0)}</p>
              <p style={{fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 500}}>Saldo pendiente</p>
           </div>

           <div className="finanzas-kpi-box" style={{background: '#0f172a', border: 'none', color: 'white'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                 <span className="finanzas-kpi-label" style={{color: '#94a3b8'}}>Balance</span>
                 <div style={{background: 'rgba(255,255,255,0.1)', color: '#10b981', width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <IconVault style={{width:'20px', height:'20px'}} />
                 </div>
              </div>
              <p className="finanzas-kpi-val" style={{color: 'white'}}>{formatMoney(summary?.netProjected ?? 0)}</p>
              <p style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 500}}>Neto estimado</p>
           </div>
        </div>

        {/* SECONDARY KPIs & METRICS */}
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem'}}>
           
           <div className="sdmx-card-premium">
              <div className="sdmx-card-header">
                 <div>
                    <h3>Operación</h3>
                    <p>Métricas de desempeño generales</p>
                 </div>
              </div>
              <div className="sdmx-card-body">
                 <div className="finanzas-kpi-secondary" style={{marginBottom: 0}}>
                    <div className="finanzas-kpi-box" style={{boxShadow: 'none', border: '1px solid #f1f5f9', background: '#f8fafc'}}>
                       <span className="finanzas-kpi-label">Tickets Activos</span>
                       <p className="finanzas-kpi-val" style={{fontSize: '1.5rem'}}>{summary?.activeOrders ?? 0}</p>
                    </div>
                    <div className="finanzas-kpi-box" style={{boxShadow: 'none', border: '1px solid #f1f5f9', background: '#f8fafc'}}>
                       <span className="finanzas-kpi-label">Base Comercial</span>
                       <p className="finanzas-kpi-val" style={{fontSize: '1.5rem'}}>{summary?.customers ?? 0}</p>
                    </div>
                    <div className="finanzas-kpi-box" style={{boxShadow: 'none', border: '1px solid #f1f5f9', background: '#f8fafc', gridColumn: 'span 2'}}>
                       <span className="finanzas-kpi-label">Ticket Promedio</span>
                       <p className="finanzas-kpi-val" style={{fontSize: '1.5rem', color: '#3b82f6'}}>{formatMoney(summary?.averageTicket ?? 0)}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="sdmx-card-premium">
              <div className="sdmx-card-header">
                 <div>
                    <h3>Histórico Mensual</h3>
                    <p>Comparativo ingresos vs egresos</p>
                 </div>
              </div>
              <div className="sdmx-card-body" style={{padding: 0}}>
                 <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
                    {(summary?.monthlyRevenue ?? []).length === 0 && (summary?.monthlyExpenses ?? []).length === 0 ? (
                      <li style={{padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem'}}>
                        <IconChart style={{width:'32px', height:'32px', marginBottom: '1rem', opacity: 0.5}} />
                        <br/>Sin información disponible.
                      </li>
                    ) : (
                      (summary?.monthlyRevenue ?? []).map((item: any, idx: number) => {
                        const expenseMatch = summary?.monthlyExpenses.find((expense: any) => expense.label === item.label);
                        return (
                          <li key={item.label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc'}}>
                             <div>
                                <strong style={{color: '#0f172a', fontWeight: 700, fontSize: '0.875rem'}}>{item.label}</strong>
                             </div>
                             <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                                <div style={{textAlign: 'right'}}>
                                   <span className="sdmx-badge sdmx-badge-emerald">+{formatMoney(item.revenue)}</span>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                   <span className="sdmx-badge sdmx-badge-red">-{formatMoney(expenseMatch?.expenses ?? 0)}</span>
                                </div>
                             </div>
                          </li>
                        );
                      })
                    )}
                 </ul>
              </div>
           </div>

        </div>
      </div>
    </FeatureGuard>
  );
}
