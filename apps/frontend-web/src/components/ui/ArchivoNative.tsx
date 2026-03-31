"use client";

import { useEffect, useState } from "react";

type ArchivedOrder = {
  id: string; folio: string; status: string; customerName?: string;
  deviceType: string; priority?: string; estimatedCost: number; promisedDate?: string;
};

import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthGuard";

function formatMoney(value: number) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0); }
function formatDate(dateStr?: string) { return dateStr ? new Intl.DateTimeFormat("es-MX", { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr)) : "Indefinida"; }

export function ArchivoNative() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [archived, setArchived] = useState<ArchivedOrder[]>([]);
  const [search, setSearch] = useState("");

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', session.shop.id)
        .in('status', ['entregado', 'cancelado', 'archivado'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setArchived(data.map((o: any) => ({
        id: o.id,
        folio: o.folio,
        status: o.status,
        deviceType: o.device_type,
        estimatedCost: Number(o.final_cost || o.estimated_cost || 0),
        promisedDate: o.updated_at
      })));
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => { 
    if (session) void loadData(); 
  }, [session]);

  const filtered = archived.filter((o) => !search || o.folio.toLowerCase().includes(search.toLowerCase()) || o.deviceType.toLowerCase().includes(search.toLowerCase()) || (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())));

  return (
    <section className="operativo-shell">
      <div className="operativo-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Historial</span>
          <h1>Archivo de Órdenes</h1>
          <p className="muted">Consulta el historial de órdenes entregadas y canceladas.</p>
        </div>
        <div className="operativo-summary" style={{alignItems: 'center', marginTop: '16px'}}>
           <div className="flex-col" style={{gridColumn: '1 / -1', flexDirection: 'row', gap: '8px', marginBottom: '8px', width: '100%'}}>
              <input type="text" className="module-search-input" style={{flex: 1}} placeholder="🔍 Buscar exacto por Folio, Equipo o Cliente histórico..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <button disabled={loading} className="product-button is-primary" onClick={loadData} style={{padding: '0 20px', minWidth: '150px'}}>{loading ? 'Leyendo...' : 'Buscar'}</button>
           </div>
        </div>
      </div>

      <div className="operativo-grid" style={{gridTemplateColumns: '1fr'}}>
        <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <div className="flex-col">
                <h3 style={{fontSize: '1.25rem', margin: 0}}>Historial de Órdenes</h3>
                <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>Mostrando {filtered.length} orden(es) en el historial.</p>
             </div>
          </div>

          <ul className="data-list scrollable-list">
            {filtered.length === 0 ? (
              <li className="empty-state">
                <strong>No hay órdenes archivadas</strong>
                <span>No se encontraron órdenes con esos filtros de búsqueda.</span>
              </li>
            ) : (
              filtered.map((order) => (
                <li key={order.id} className="list-item-grid" style={{background: order.status === 'cancelado' ? '#fef2f2' : '#f8fafc'}}>
                   <div style={{ background: '#0f172a', color: 'white', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Folio: {order.folio}
                   </div>
                   <div className="flex-col">
                     <strong style={{fontSize: '1.05rem', color: '#1e3a8a'}}>{order.customerName || "Venta de mostrador"}</strong>
                     <span style={{color: '#64748b', fontSize: '0.85rem'}}>Servicio: {order.deviceType} · Liquidado/Cancelado el: {formatDate(order.promisedDate)}</span>
                   </div>
                   <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                     <span className={`badge-${order.status === 'cancelado' ? 'danger' : 'neutral'}`}>DICTAMEN: {order.status.toUpperCase()}</span>
                     <span style={{fontSize: '0.95rem', fontWeight: 'bold', color: order.status === 'cancelado' ? '#ef4444' : '#0f172a'}}>Costo final: {formatMoney(order.estimatedCost)}</span>
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
