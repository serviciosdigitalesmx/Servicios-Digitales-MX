"use client";

import { useEffect, useMemo, useState } from "react";
import { IconMoneyUp, IconMoneyDown, IconReceipt, IconVault, IconChart, IconSync, IconDownload, IconWarning } from "./Icons";
import { useAuth } from "./AuthGuard";
import { FeatureGuard } from "./FeatureGuard";
import { PlanLevel } from "../../lib/subscription";
import { fetchWithAuth } from "../../lib/apiClient";

type MonthlyFinancePoint = { label: string; revenue?: number; expenses?: number };

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
  categoryBreakdown: Array<{ label: string; amount: number }>;
  purchasePressurePct: number;
  expensePressurePct: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0);
}

function getMonthLabel(dateInput?: string) {
  if (!dateInput) return "Sin fecha";
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit" }).format(date);
}

function normalizeMonthLabel(label?: string) {
  if (!label) return "Sin fecha";
  if (/^\d{4}-\d{2}$/.test(label)) {
    return getMonthLabel(`${label}-01T00:00:00`);
  }
  return label;
}

export function FinanzasNative({ tenantId }: any = {}) {
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
      const response = await fetchWithAuth<FinanceSummary>('/api/finance/summary');
      const payload = await response.json();
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Error al obtener el consolidado.");
      }

      const remote = payload.data as any;
      setSummary({
        projectedRevenue: Number(remote.projectedRevenue || 0),
        expenseTotal: Number(remote.expenseTotal || 0),
        purchaseCommitted: Number(remote.purchaseCommitted || 0),
        netProjected: Number(remote.netProjected || 0),
        activeOrders: Number(remote.activeOrders || 0),
        customers: Number(remote.customers || 0),
        averageTicket: Number(remote.averageTicket || 0),
        monthlyRevenue: Array.isArray(remote.monthlyRevenue)
          ? remote.monthlyRevenue.map((item: any) => ({ label: normalizeMonthLabel(item.label), revenue: Number(item.revenue || 0) }))
          : [],
        monthlyExpenses: Array.isArray(remote.monthlyExpenses)
          ? remote.monthlyExpenses.map((item: any) => ({ label: normalizeMonthLabel(item.label), expenses: Number(item.expenses || 0) }))
          : [],
        categoryBreakdown: Array.isArray(remote.categoryBreakdown)
          ? remote.categoryBreakdown.map((item: any) => ({ label: item.label, amount: Number(item.amount || 0) }))
          : [],
        purchasePressurePct: Math.round(Number(remote.purchasePressurePct || 0)),
        expensePressurePct: Math.round(Number(remote.expensePressurePct || 0))
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

  const monthlyComparison = useMemo<MonthlyFinancePoint[]>(() => {
    if (!summary) return [];
    const bucket = new Map<string, MonthlyFinancePoint>();
    for (const item of summary.monthlyRevenue) {
      bucket.set(item.label, { ...(bucket.get(item.label) || { label: item.label }), revenue: item.revenue });
    }
    for (const item of summary.monthlyExpenses) {
      bucket.set(item.label, { ...(bucket.get(item.label) || { label: item.label }), expenses: item.expenses });
    }
    return Array.from(bucket.values()).sort((a, b) => a.label.localeCompare(b.label, "es-MX"));
  }, [summary]);

  const financeSignals = useMemo(() => {
    if (!summary) return [];
    const signals = [
      {
        title: "Presión por egresos",
        value: `${summary.expensePressurePct}%`,
        message: summary.expensePressurePct >= 60
          ? "Los egresos están consumiendo demasiado del ingreso proyectado; conviene revisar categorías de mayor fuga."
          : "El gasto sigue en un rango manejable para el volumen proyectado."
      },
      {
        title: "Presión por compras",
        value: `${summary.purchasePressurePct}%`,
        message: summary.purchasePressurePct >= 40
          ? "El abastecimiento comprometido ya pesa fuerte sobre el flujo. Revisa recepción y rotación."
          : "Las compras comprometidas aún están en un rango razonable."
      },
      {
        title: "Órdenes activas",
        value: `${summary.activeOrders}`,
        message: summary.activeOrders >= 10
          ? "La operación sigue cargada; cuida tiempos de promesa y avance técnico."
          : "La carga operativa está controlada por ahora."
      }
    ];
    return signals;
  }, [summary]);

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
                    <h3>Señales del negocio</h3>
                    <p>Lecturas rápidas para entender si el flujo está sano o empieza a apretarse.</p>
                 </div>
              </div>
              <div className="sdmx-card-body">
                 <div className="grid-cols-3">
                    {financeSignals.map((signal) => (
                      <div key={signal.title} className="finanzas-kpi-box" style={{boxShadow: 'none', border: '1px solid #f1f5f9', background: '#f8fafc'}}>
                        <span className="finanzas-kpi-label">{signal.title}</span>
                        <p className="finanzas-kpi-val" style={{fontSize: '1.5rem'}}>{signal.value}</p>
                        <p style={{fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5}}>{signal.message}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="sdmx-card-premium">
              <div className="sdmx-card-header">
                 <div>
                    <h3>Composición del gasto</h3>
                    <p>Las categorías con mayor impacto para decidir dónde atacar primero.</p>
                 </div>
              </div>
              <div className="sdmx-card-body" style={{padding: 0}}>
                 {summary?.categoryBreakdown?.length ? (
                  <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
                    {summary.categoryBreakdown.map((item, idx) => {
                      const share = summary.expenseTotal > 0 ? Math.round((item.amount / summary.expenseTotal) * 100) : 0;
                      return (
                        <li key={item.label} style={{padding: '1.1rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc'}}>
                          <div className="flex-row-between" style={{alignItems: 'center', gap: '1rem'}}>
                            <div className="flex-col">
                              <strong style={{color: '#0f172a', fontSize: '0.9rem'}}>{item.label.toUpperCase()}</strong>
                              <span style={{color: '#64748b', fontSize: '0.8rem'}}>{share}% del total de egresos</span>
                            </div>
                            <div style={{textAlign: 'right'}}>
                              <span className="sdmx-badge sdmx-badge-red">-{formatMoney(item.amount)}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                 ) : (
                  <div style={{padding: '2.5rem 2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem'}}>
                    Sin gasto categorizado suficiente para construir lectura comparativa.
                  </div>
                 )}
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
                    {monthlyComparison.length === 0 ? (
                      <li style={{padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem'}}>
                        <IconChart style={{width:'32px', height:'32px', marginBottom: '1rem', opacity: 0.5}} />
                        <br/>Sin información disponible.
                      </li>
                    ) : (
                      monthlyComparison.map((item, idx) => {
                        const revenue = item.revenue ?? 0;
                        const expenses = item.expenses ?? 0;
                        const net = revenue - expenses;
                        return (
                          <li key={item.label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc'}}>
                             <div>
                                <strong style={{color: '#0f172a', fontWeight: 700, fontSize: '0.875rem'}}>{item.label}</strong>
                                <div style={{fontSize: '0.75rem', color: net >= 0 ? '#047857' : '#b91c1c', marginTop: '4px'}}>
                                  Neto: {formatMoney(net)}
                                </div>
                             </div>
                             <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                                <div style={{textAlign: 'right'}}>
                                   <span className="sdmx-badge sdmx-badge-emerald">+{formatMoney(revenue)}</span>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                   <span className="sdmx-badge sdmx-badge-red">-{formatMoney(expenses)}</span>
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
