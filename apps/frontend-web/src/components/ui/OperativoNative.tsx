"use client";

import { FormEvent, useEffect, useState } from "react";

type AuthResponse = {
  data: {
    user: {
      branchId: string;
      fullName: string;
    };
    shop: {
      name: string;
    };
    subscription: {
      operationalAccess: boolean;
      status: string;
    };
  };
};

type Customer = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  tag: string;
};

type Order = {
  id: string;
  folio: string;
  status: string;
  deviceType: string;
  deviceModel?: string;
  promisedDate?: string;
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

function formatDate(value?: string) {
  if (!value) return "Sin promesa";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function OperativoNative() {
  const [auth, setAuth] = useState<AuthResponse["data"] | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [customerForm, setCustomerForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    tag: "nuevo",
    notes: ""
  });
  const [orderForm, setOrderForm] = useState({
    customerId: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    serialNumber: "",
    reportedIssue: "",
    priority: "normal",
    promisedDate: "",
    estimatedCost: "0"
  });

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const authData = await fetchJson<AuthResponse>("/api/auth/me");
      setAuth(authData.data);

      if (!authData.data.subscription.operationalAccess) {
        setCustomers([]);
        setOrders([]);
        return;
      }

      const [customersData, ordersData] = await Promise.all([
        fetchJson<{ data: Customer[] }>("/api/customers"),
        fetchJson<{ data: Order[] }>("/api/service-orders")
      ]);

      setCustomers(customersData.data);
      setOrders(ordersData.data);

      if (!orderForm.customerId && customersData.data.length > 0) {
        setOrderForm((current) => ({
          ...current,
          customerId: customersData.data[0].id
        }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar operativo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await fetchJson("/api/customers", {
        method: "POST",
        body: JSON.stringify(customerForm)
      });

      setCustomerForm({
        fullName: "",
        phone: "",
        email: "",
        tag: "nuevo",
        notes: ""
      });

      await loadData();
      setMessage("Cliente creado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el cliente");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth?.user.branchId) {
      setMessage("No hay sucursal activa para crear la orden.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await fetchJson("/api/service-orders", {
        method: "POST",
        body: JSON.stringify({
          branchId: auth.user.branchId,
          customerId: orderForm.customerId,
          serviceRequestId: null,
          deviceType: orderForm.deviceType,
          deviceBrand: orderForm.deviceBrand,
          deviceModel: orderForm.deviceModel,
          serialNumber: orderForm.serialNumber,
          reportedIssue: orderForm.reportedIssue,
          priority: orderForm.priority,
          promisedDate: orderForm.promisedDate || null,
          estimatedCost: Number(orderForm.estimatedCost || 0)
        })
      });

      setOrderForm((current) => ({
        ...current,
        deviceType: "",
        deviceBrand: "",
        deviceModel: "",
        serialNumber: "",
        reportedIssue: "",
        priority: "normal",
        promisedDate: "",
        estimatedCost: "0"
      }));

      await loadData();
      setMessage("Orden creada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la orden");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="operativo-shell">
      <div className="operativo-header">
        <div>
          <span className="hero-eyebrow">Operativo nativo</span>
          <h1>Nueva orden de servicio</h1>
          <p>
            Este ya no es puente ni maqueta. Este bloque crea clientes y órdenes reales sobre
            `Supabase` usando el backend nuevo en `.NET`.
          </p>
        </div>
        <div className="operativo-summary">
          <div>
            <span>Shop</span>
            <strong>{auth?.shop.name ?? "Cargando..."}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{auth?.subscription.status ?? "..."}</strong>
          </div>
          <div>
            <span>Clientes</span>
            <strong>{customers.length}</strong>
          </div>
          <div>
            <span>Órdenes</span>
            <strong>{orders.length}</strong>
          </div>
        </div>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="operativo-grid">
        <form className="card form-card operativo-card" onSubmit={handleCreateCustomer}>
          <h3>1. Datos del cliente</h3>
          <label>
            Nombre completo
            <input
              value={customerForm.fullName}
              onChange={(event) => setCustomerForm({ ...customerForm, fullName: event.target.value })}
              required
            />
          </label>
          <label>
            WhatsApp
            <input
              value={customerForm.phone}
              onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={customerForm.email}
              onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })}
            />
          </label>
          <label>
            Etiqueta
            <select
              value={customerForm.tag}
              onChange={(event) => setCustomerForm({ ...customerForm, tag: event.target.value })}
            >
              <option value="nuevo">Nuevo</option>
              <option value="frecuente">Frecuente</option>
              <option value="vip">VIP</option>
            </select>
          </label>
          <label>
            Notas
            <textarea
              value={customerForm.notes}
              onChange={(event) => setCustomerForm({ ...customerForm, notes: event.target.value })}
            />
          </label>
          <button type="submit" disabled={loading}>
            Guardar cliente
          </button>
        </form>

        <form className="card form-card operativo-card" onSubmit={handleCreateOrder}>
          <h3>2. Datos del equipo</h3>
          <label>
            Cliente
            <select
              value={orderForm.customerId}
              onChange={(event) => setOrderForm({ ...orderForm, customerId: event.target.value })}
              required
            >
              <option value="">Selecciona cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de equipo
            <input
              value={orderForm.deviceType}
              onChange={(event) => setOrderForm({ ...orderForm, deviceType: event.target.value })}
              required
            />
          </label>
          <label>
            Marca
            <input
              value={orderForm.deviceBrand}
              onChange={(event) => setOrderForm({ ...orderForm, deviceBrand: event.target.value })}
            />
          </label>
          <label>
            Modelo
            <input
              value={orderForm.deviceModel}
              onChange={(event) => setOrderForm({ ...orderForm, deviceModel: event.target.value })}
            />
          </label>
          <label>
            Serie
            <input
              value={orderForm.serialNumber}
              onChange={(event) => setOrderForm({ ...orderForm, serialNumber: event.target.value })}
            />
          </label>
          <label>
            Falla reportada
            <textarea
              value={orderForm.reportedIssue}
              onChange={(event) => setOrderForm({ ...orderForm, reportedIssue: event.target.value })}
              required
            />
          </label>
          <label>
            Prioridad
            <select
              value={orderForm.priority}
              onChange={(event) => setOrderForm({ ...orderForm, priority: event.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>
          <label>
            Fecha promesa
            <input
              type="date"
              value={orderForm.promisedDate}
              onChange={(event) => setOrderForm({ ...orderForm, promisedDate: event.target.value })}
            />
          </label>
          <label>
            Costo estimado
            <input
              type="number"
              min="0"
              step="0.01"
              value={orderForm.estimatedCost}
              onChange={(event) => setOrderForm({ ...orderForm, estimatedCost: event.target.value })}
            />
          </label>
          <button type="submit" disabled={loading || customers.length === 0}>
            Guardar orden
          </button>
        </form>

        <article className="card operativo-card operativo-orders">
          <h3>3. Órdenes recientes</h3>
          <p className="muted">Estas órdenes ya vienen del backend nuevo.</p>
          <ul className="data-list">
            {orders.length === 0 ? (
              <li>
                <strong>Sin órdenes todavía</strong>
                <span>Crea la primera orden desde este mismo módulo.</span>
              </li>
            ) : (
              orders.map((order) => (
                <li key={order.id}>
                  <strong>{order.folio}</strong>
                  <span>
                    {order.deviceType} {order.deviceModel ?? ""} · {order.status} ·{" "}
                    {formatDate(order.promisedDate)}
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
