"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/apiClient";

type Supplier = { id: string; businessName: string; };

type Expense = {
  id: string; expenseType: string; category: string; concept: string;
  description?: string; amount: number; paymentMethod?: string;
  expenseDate: string; supplierName?: string;
};
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
        fetchWithAuth("/api/suppliers"),
        fetchWithAuth("/api/expenses?page=1&pageSize=100")
      ]);

      const suppliersPayload = await (suppliersRes as any).json();
      const expensesPayload = await (expensesRes as any).json();

      if (!(suppliersRes as any).ok) throw new Error(suppliersPayload?.error?.message || "Error al cargar proveedores.");
      if (!(expensesRes as any).ok) throw new Error(expensesPayload?.error?.message || "Error al cargar gastos.");

      setSuppliers((Array.isArray(suppliersPayload?.data) ? suppliersPayload.data : []).map((s: any) => ({ id: s.id, businessName: s.businessName })));
      setExpenses((Array.isArray(expensesPayload?.data) ? expensesPayload.data : []).map((e: any) => ({
        id: e.id,
        expenseType: e.expenseType,
        category: e.category,
        concept: e.concept,
        description: e.description,
        amount: Number(e.amount || 0),
        paymentMethod: e.paymentMethod,
        expenseDate: e.expenseDate,
        supplierName: e.supplierName ?? undefined
      })));
    } catch (error: unknown) { setApiStateError(error instanceof Error ? error.message : "Error al cargar los datos."); } finally { setLoading(false); }
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
      const response = await fetchWithAuth("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          supplierId: form.supplierId || null,
          expenseType: form.expenseType,
          category: form.category,
          concept: form.concept.trim(),
          description: form.description.trim() || null,
          amount: amountNum,
          paymentMethod: form.paymentMethod,
          notes: form.notes.trim() || null,
          expenseDate: form.expenseDate
        })
      });
      const payload = await (response as any).json();
      if (!(response as any).ok) throw new Error(payload?.error?.message || "Ocurrió un error al guardar el registro.");

      setForm({
        supplierId: "", expenseType: "variable", category: "insumos", concept: "", description: "",
        amount: "0", paymentMethod: "transferencia", notes: "", expenseDate: new Date().toISOString().slice(0, 10)
      });
      await loadData();
      setApiStateMessage("✅ Gasto registrado exitosamente.");
    } catch (error: unknown) { setApiStateError(error instanceof Error ? error.message : "Ocurrió un error al guardar el registro."); } finally { setLoading(false); }
  }

  const filteredExpenses = expenses.filter(e => !search || e.concept.toLowerCase().includes(search.toLowerCase()) || (e.supplierName && e.supplierName.toLowerCase().includes(search.toLowerCase())));

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div className="flex-col">
          <span className="hero-eyebrow">Finanzas</span>
          <h1>Gastos y salidas operativas</h1>
          <p className="muted">Registra egresos con contexto claro para entender a dónde se va el dinero y mantener orden financiero del taller.</p>
        </div>
        <div className="module-native-actions flex-row-between" style={{flex: 1, justifyContent: 'flex-end', gap: '12px'}}>
           <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <span style={{ position: "absolute", top: "14px", left: "14px", opacity: 0.5, fontSize: "1.1rem" }}>🔍</span>
            <input className="module-search-input" style={{ width: "100%", paddingLeft: "42px", paddingRight: "16px", height: "48px" }}
              placeholder="Buscar por concepto o proveedor..." value={search} onChange={(event) => setSearch(event.target.value)} />
           </div>
           <button type="button" disabled={loading} className="product-button" onClick={() => void loadData()}>
             Actualizar gastos
          </button>
        </div>
      </div>

      {apiStateMessage && <div className="form-message is-success">{apiStateMessage}</div>}
      {apiStateError && <div className="form-message is-error">{apiStateError}</div>}

      <div className="module-native-grid module-native-grid-wide">
        <form className="sdmx-card-premium" onSubmit={handleSubmit}>
          <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
             <h3 style={{fontSize: '1.25rem', margin: 0}}>Nuevo gasto</h3>
             <p className="muted" style={{margin: '4px 0 0 0', fontSize: '0.85rem'}}>Documenta cada salida con fecha, categoría y método de pago.</p>
          </div>
          {formError && <div className="form-message is-warning">{formError}</div>}
          
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Concepto del gasto *</label>
             <input required value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} placeholder="Ej. Pago Recibo de Luz o Compra Desayuno" />
          </div>

          <div className="grid-cols-2" style={{marginBottom: '10px'}}>
             <div className="flex-col"><label style={{margin:0, color: '#b91c1c', fontWeight: 'bold'}}>Importe ($) *</label><input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
             <div className="flex-col"><label style={{margin:0}}>Fecha del gasto</label><input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} /></div>
          </div>
          
          <div className="grid-cols-3" style={{background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '10px'}}>
             <div className="flex-col"><label style={{margin:0}}>Categoría</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                   <option value="insumos">Equipos Insumos</option><option value="refacciones">Stock Secundario</option><option value="servicios">Servicios Básicos</option>
                   <option value="nomina">Nómina Directa</option><option value="transporte">Viáticos CFE / Domicilio</option><option value="otros">Otros</option>
                </select>
             </div>
             <div className="flex-col"><label style={{margin:0}}>Método de pago</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                   <option value="efectivo">Caja / Cash</option><option value="transferencia">SPEI Transfer</option><option value="tarjeta">Crédito o Terminal</option>
                </select>
             </div>
             <div className="flex-col"><label style={{margin:0}}>Tipo de gasto</label>
                <select value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })}>
                   <option value="variable">Fuga Esporádica</option><option value="fijo">Carga Fija Ordinaria</option>
                </select>
             </div>
          </div>

          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label style={{fontWeight: 'bold'}}>Vincular a proveedor</label>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">-- Sin proveedor asociado --</option>
              {suppliers.map((supplier) => (<option key={supplier.id} value={supplier.id}>{supplier.businessName}</option>))}
            </select>
          </div>
          <div className="flex-col" style={{marginBottom: '10px'}}>
             <label>Descripción o contexto</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe la causa, el comprobante o el contexto del gasto." style={{minHeight: "80px"}} />
          </div>
          
          <button type="submit" disabled={loading} className="product-button is-primary" style={{marginTop: '16px'}}>Registrar gasto</button>
        </form>

        <article className="sdmx-card-premium" style={{display: "flex", flexDirection: "column"}}>
           <div style={{borderBottom: '1px solid rgba(15,23,42,0.08)', paddingBottom: '16px', marginBottom: '16px'}}>
              <h3 style={{fontSize: '1.25rem', margin: 0}}>Historial de gastos</h3>
              <p className="muted" style={{margin: 0, fontSize: '0.85rem'}}>Mostrando {filteredExpenses.length} registro(s) visibles.</p>
           </div>
          <ul className="data-list scrollable-list">
            {filteredExpenses.length === 0 ? (
               <li className="empty-state">
                  <strong>No hay gastos registrados</strong>
                  <span>Registra el primer egreso para empezar a construir tu historial financiero.</span>
               </li>
            ) : (
              filteredExpenses.map((expense) => (
                <li key={expense.id} className="list-item-grid">
                  <div className="flex-col">
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{expense.concept}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Categoría: {expense.category.toUpperCase()} · Tipo: {expense.expenseType}
                      {expense.supplierName ? ` · Proveedor: ${expense.supplierName}` : ""}
                    </span>
                    <span style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px'}}>🗓 Registrado el {formatDate(expense.expenseDate)} vía {expense.paymentMethod}</span>
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
