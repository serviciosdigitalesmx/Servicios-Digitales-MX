"use client";

import { FormEvent, useEffect, useState } from "react";

type Supplier = {
  id: string;
  businessName: string;
};

type Expense = {
  id: string;
  expenseType: string;
  category: string;
  concept: string;
  description?: string;
  amount: number;
  paymentMethod?: string;
  expenseDate: string;
  supplierName?: string;
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function GastosNative() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    supplierId: "",
    expenseType: "variable",
    category: "insumos",
    concept: "",
    description: "",
    amount: "0",
    paymentMethod: "transferencia",
    notes: "",
    expenseDate: new Date().toISOString().slice(0, 10)
  });

  async function loadData() {
    setLoading(true);
    try {
      const [suppliersResult, expensesResult] = await Promise.all([
        fetchJson<{ data: Supplier[] }>("/api/suppliers"),
        fetchJson<{ data: Expense[] }>("/api/expenses")
      ]);
      setSuppliers(suppliersResult.data);
      setExpenses(expensesResult.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar los gastos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await fetchJson("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          supplierId: form.supplierId || null,
          expenseType: form.expenseType,
          category: form.category,
          concept: form.concept,
          description: form.description,
          amount: Number(form.amount || 0),
          paymentMethod: form.paymentMethod,
          notes: form.notes,
          expenseDate: form.expenseDate
        })
      });
      setForm({
        supplierId: "",
        expenseType: "variable",
        category: "insumos",
        concept: "",
        description: "",
        amount: "0",
        paymentMethod: "transferencia",
        notes: "",
        expenseDate: new Date().toISOString().slice(0, 10)
      });
      await loadData();
      setMessage("Gasto guardado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el gasto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-native-shell">
      <div className="module-native-header">
        <div>
          <span className="hero-eyebrow">Gastos nativo</span>
          <h1>Control de gastos</h1>
          <p>Este panel ya registra egresos reales y alimenta el resumen financiero del shop.</p>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="module-native-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Nuevo gasto</h3>
          <label>
            Tipo
            <select value={form.expenseType} onChange={(event) => setForm({ ...form, expenseType: event.target.value })}>
              <option value="fijo">Fijo</option>
              <option value="variable">Variable</option>
            </select>
          </label>
          <label>
            Categoría
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option value="insumos">Insumos</option>
              <option value="refacciones">Refacciones</option>
              <option value="servicios">Servicios</option>
              <option value="nomina">Nómina</option>
              <option value="transporte">Transporte</option>
              <option value="otros">Otros</option>
            </select>
          </label>
          <label>
            Proveedor
            <select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
              <option value="">Sin proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.businessName}</option>
              ))}
            </select>
          </label>
          <label>
            Concepto
            <input required value={form.concept} onChange={(event) => setForm({ ...form, concept: event.target.value })} />
          </label>
          <label>
            Descripción
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label>
            Monto
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </label>
          <label>
            Método de pago
            <input value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} />
          </label>
          <label>
            Fecha
            <input type="date" value={form.expenseDate} onChange={(event) => setForm({ ...form, expenseDate: event.target.value })} />
          </label>
          <button type="submit" disabled={loading}>Guardar gasto</button>
        </form>

        <article className="card">
          <h3>Gastos recientes</h3>
          <ul className="data-list">
            {expenses.length === 0 ? (
              <li>
                <strong>Sin gastos todavía</strong>
                <span>Cuando registres egresos aquí, aparecerán en esta lista.</span>
              </li>
            ) : (
              expenses.map((expense) => (
                <li key={expense.id}>
                  <strong>{expense.concept} · {formatMoney(expense.amount)}</strong>
                  <span>
                    {expense.category} · {expense.expenseType}
                    {expense.supplierName ? ` · ${expense.supplierName}` : ""}
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
