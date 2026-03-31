"use client";

import { FormEvent, useEffect, useState } from "react";

type Supplier = { id: string; businessName: string; };

type Expense = {
  id: string; expenseType: string; category: string; concept: string;
  description?: string; amount: number; paymentMethod?: string;
  expenseDate: string; supplierName?: string;
};

import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthGuard";

function formatMoney(value: number) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0); }

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("es-MX", { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}

export function GastosNative() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    supplierId: "", expenseType: "variable", category: "insumos", concept: "", description: "",
    amount: "0", paymentMethod: "transferencia", notes: "", expenseDate: new Date().toISOString().slice(0, 10)
  });

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true); setApiStateMessage(""); setApiStateError("");
    try {
      const [suppliersRes, expensesRes] = await Promise.all([
        supabase.from('suppliers').select('id, business_name').eq('tenant_id', session.shop.id).eq('is_active', true).order('business_name'),
        supabase.from('expenses').select('*').eq('tenant_id', session.shop.id).order('expense_date', { ascending: false })
      ]);

      if (suppliersRes.error) throw suppliersRes.error;
      if (expensesRes.error) throw expensesRes.error;

      setSuppliers(suppliersRes.data.map((s: any) => ({ id: s.id, businessName: s.business_name })));
      setExpenses(expensesRes.data.map((e: any) => ({
        id: e.id,
        expenseType: e.expense_type,
        category: e.category,
        concept: e.concept,
        description: e.description,
        amount: Number(e.amount || 0),
        paymentMethod: e.payment_method,
        expenseDate: e.expense_date
      })));
    } catch (error: any) { setApiStateError(error.message || "Error al cargar los datos."); } finally { setLoading(false); }
  }

  useEffect(() => { 
    if (session) void loadData(); 
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); setApiStateMessage(""); setApiStateError("");

    if (!form.concept.trim()) return setFormError("⚠️ El concepto del gasto es obligatorio.");
    const amountNum = Number(form.amount || 0);
    if (amountNum <= 0) return setFormError("⚠️ El monto del gasto debe ser mayor a cero.");

    setLoading(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        tenant_id: session?.shop.id,
        supplier_id: form.supplierId || null,
        expense_type: form.expenseType,
        category: form.category,
        concept: form.concept.trim(),
        description: form.description,
        amount: amountNum,
        payment_method: form.paymentMethod,
        expense_date: form.expenseDate,
        created_by: session?.user.id,
        updated_by: session?.user.id
      });

      if (error) throw error;

      setForm({
        supplierId: "", expenseType: "variable", category: "insumos", concept: "", description: "",
        amount: "0", paymentMethod: "transferencia", notes: "", expenseDate: new Date().toISOString().slice(0, 10)
      });
      await loadData();
      setApiStateMessage("✅ Gasto registrado exitosamente.");
    } catch (error: any) { setApiStateError(error.message || "Ocurrió un error al guardar el registro."); } finally { setLoading(false); }
  }

  const filteredExpenses = expenses.filter(e => !search || e.concept.toLowerCase().includes(search.toLowerCase()) || (e.supplierName && e.supplierName.toLowerCase().includes(search.toLowerCase())));

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Finanzas</span>
          <h1>Deducciones y Gastos</h1>
          <p className="muted">Lleva el control de los costos directos e indirectos operativos (Nóminas, Servicios, Rentas, etc).</p>
        </div>
        <div className="module-native-actions flex-row-between" style={{flex: 1, justifyContent: 'flex-end', gap: '12px'}}>
           <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <span style={{ position: "absolute", top: "14px", left: "14px", opacity: 0.5, fontSize: "1.1rem" }}>🔍</span>
            <input className="module-search-input" style={{ width: "100%", paddingLeft: "42px", paddingRight: "16px", height: "48px" }}
              placeholder="Buscar por concepto o proveedor..." value={search} onChange={(event) => setSearch(event.target.value)} />
           </div>
           <button type="button" disabled={loading} className="product-button" onClick={() => void loadData()}>
             Refrescar Datos
          </button>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="form-message is-error">{apiStateError}</div>}

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Alta de Gasto</h3>
             <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Registra debidamente cada erogación.</p>
          </div>
          {formError && <div className="form-message is-warning">{formError}</div>}
          
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Concepto del Gasto *</label>
             <input required value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} placeholder="Ej. Pago Recibo de Luz o Compra Desayuno" />
          </div>

          <div className="grid-cols-2" style={{marginBottom: '10px'}}>
             <div className="flex-col"><label style={{margin:0, color: '#b91c1c', fontWeight: 'bold'}}>Importe ($) *</label><input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
             <div className="flex-col"><label style={{margin:0}}>Fecha del Gasto</label><input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} /></div>
          </div>
          
          <div className="grid-cols-3" style={{background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '10px'}}>
             <div className="flex-col"><label style={{margin:0}}>Clasificación</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                   <option value="insumos">Equipos Insumos</option><option value="refacciones">Stock Secundario</option><option value="servicios">Servicios Básicos</option>
                   <option value="nomina">Nómina Directa</option><option value="transporte">Viáticos CFE / Domicilio</option><option value="otros">Otros</option>
                </select>
             </div>
             <div className="flex-col"><label style={{margin:0}}>Método de Pago</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                   <option value="efectivo">Caja / Cash</option><option value="transferencia">SPEI Transfer</option><option value="tarjeta">Crédito o Terminal</option>
                </select>
             </div>
             <div className="flex-col"><label style={{margin:0}}>Tipo de Gasto</label>
                <select value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })}>
                   <option value="variable">Fuga Esporádica</option><option value="fijo">Carga Fija Ordinaria</option>
                </select>
             </div>
          </div>

          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Vincular a Proveedor (Opcional)</label>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">-- Consumo al Público General --</option>
              {suppliers.map((supplier) => (<option key={supplier.id} value={supplier.id}>{supplier.businessName}</option>))}
            </select>
          </div>
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label>Comentarios / Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe la causa y el folio fiscal del evento." style={{minHeight: "80px"}} />
          </div>
          
          <button type="submit" disabled={loading} className="product-button is-primary" style={{marginTop: '16px'}}>Registrar Gasto</button>
        </form>

        <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
           <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
              <h3 style={{fontSize: '1.25rem', margin: 0}}>Historial de Gastos</h3>
              <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>Mostrando {filteredExpenses.length} evento(s) de gasto.</p>
           </div>
          <ul className="data-list scrollable-list">
            {filteredExpenses.length === 0 ? (
               <li className="empty-state">
                  <strong>No hay gastos registrados</strong>
                  <span>Actualmente no hay salidas de capital documentadas.</span>
               </li>
            ) : (
              filteredExpenses.map((expense) => (
                <li key={expense.id} className="list-item-grid">
                  <div className="flex-col">
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{expense.concept}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Punto clave: {expense.category.toUpperCase()} ({expense.expenseType}) 
                      {expense.supplierName ? ` · Pagado a: ${expense.supplierName}` : ""}
                    </span>
                    <span style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px'}}>🗓 Acuse {formatDate(expense.expenseDate)} mediante {expense.paymentMethod}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '6px 14px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '900', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                       - {formatMoney(expense.amount)}
                    </span>
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
