"use client";

import { FormEvent, useEffect, useState } from "react";
import { SubscriptionGuard } from "./SubscriptionGuard";

type AuthMeResponse = {
  data: {
    user: {
      id: string;
      tenantId: string;
      shopId: string;
      branchId: string;
      fullName: string;
      email: string;
      role: string;
      referralCode?: string;
      balance?: number;
    };
    shop: {
      id: string;
      name: string;
      slug: string;
    };
    subscription: {
      id: string;
      status: string;
      planCode: string;
      planName: string;
      priceMxn: number;
      billingInterval: string;
      currentPeriodStart?: string;
      currentPeriodEnd?: string;
      graceUntil?: string;
      operationalAccess: boolean;
    };
  };
};

type Referral = {
  id: string;
  status: string;
  commissionAmount: number;
  referralCodeUsed: string;
  paymentProvider?: string;
  providerPaymentId?: string;
  confirmedAt?: string;
  createdAt: string;
  referredShop?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type Customer = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  tag: string;
};

type ServiceOrder = {
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

export function SprintOneConsole() {
  const [auth, setAuth] = useState<AuthMeResponse["data"] | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
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

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    try {
      const authData = await fetchJson<AuthMeResponse>("/api/auth/me");
      setAuth(authData.data);

      if (!authData.data.subscription.operationalAccess) {
        setCustomers([]);
        setOrders([]);
        setReferrals([]);
        return;
      }

      const [customersData, ordersData, referralsData] = await Promise.all([
        fetchJson<{ data: Customer[] }>("/api/customers"),
        fetchJson<{ data: ServiceOrder[] }>("/api/service-orders"),
        fetchJson<{ data: Referral[] }>("/api/referrals")
      ]);

      setCustomers(customersData.data);
      setOrders(ordersData.data);
      setReferrals(referralsData.data);

      if (!orderForm.customerId && customersData.data.length > 0) {
        setOrderForm((current) => ({
          ...current,
          customerId: customersData.data[0].id
        }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function handleDemoLogin() {
    setMessage("");
    setLoading(true);

    try {
      await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@taller.com",
          password: "Admin123!"
        })
      });
      await loadDashboard();
      setMessage("Login demo validado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo validar el login");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

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
      await loadDashboard();
      setMessage("Cliente creado en Supabase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el cliente");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth?.user.branchId) {
      setMessage("No hay sucursal demo activa.");
      return;
    }

    setMessage("");
    setLoading(true);

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

      await loadDashboard();
      setMessage("Orden creada en Supabase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la orden");
    } finally {
      setLoading(false);
    }
  }

  const isBlocked = auth?.subscription.operationalAccess === false;
  const confirmedReferrals = referrals.filter((item) => item.status === "confirmed").length;
  const pendingReferrals = referrals.filter((item) => item.status === "pending").length;

  return (
    <section className="console-shell">
      <div className="console-stack">
        <div className={isBlocked ? "console-content is-blocked" : "console-content"}>
          <div className="console-header">
            <div>
              <span className="eyebrow">Sprint 1</span>
              <h2>Consola conectada a Supabase real</h2>
              <p>
                Valida login demo, shop bootstrap, clientes y ordenes de servicio ya persistidas
                en la base del proyecto nuevo.
              </p>
            </div>
            <div className="console-actions">
              <button type="button" onClick={() => void loadDashboard()} disabled={loading}>
                Refrescar
              </button>
              <button type="button" onClick={() => void handleDemoLogin()} disabled={loading}>
                Validar login demo
              </button>
            </div>
          </div>

          {message ? <div className="console-message">{message}</div> : null}

          <div className="console-grid">
            <article className="card card-highlight">
              <h3>Contexto actual</h3>
              {auth ? (
                <dl className="context-list">
                  <div>
                    <dt>Shop</dt>
                    <dd>{auth.shop.name}</dd>
                  </div>
                  <div>
                    <dt>Slug</dt>
                    <dd>{auth.shop.slug}</dd>
                  </div>
                  <div>
                    <dt>Usuario</dt>
                    <dd>{auth.user.fullName}</dd>
                  </div>
                  <div>
                    <dt>Rol</dt>
                    <dd>{auth.user.role}</dd>
                  </div>
                  <div>
                    <dt>Suscripción</dt>
                    <dd>{auth.subscription.status}</dd>
                  </div>
                  <div>
                    <dt>Código referido</dt>
                    <dd>{auth.user.referralCode ?? "Sin código"}</dd>
                  </div>
                  <div>
                    <dt>Saldo</dt>
                    <dd>${Number(auth.user.balance ?? 0).toFixed(2)} MXN</dd>
                  </div>
                </dl>
              ) : (
                <p>Cargando contexto...</p>
              )}
            </article>

            <article className="card">
              <h3>Clientes</h3>
              <p className="muted">{customers.length} cliente(s) encontrados.</p>
              <ul className="data-list">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <strong>{customer.fullName}</strong>
                    <span>{customer.email || customer.phone || "Sin contacto"}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card">
              <h3>Ordenes</h3>
              <p className="muted">{orders.length} orden(es) registradas.</p>
              <ul className="data-list">
                {orders.map((order) => (
                  <li key={order.id}>
                    <strong>{order.folio}</strong>
                    <span>
                      {order.deviceType} {order.deviceModel ?? ""} · {order.status}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="console-grid forms-grid">
            <article className="card card-highlight referral-summary-card">
              <h3>Programa de referidos</h3>
              <p className="muted">
                Comparte tu código y gana <strong>$150 MXN</strong> por cada suscripción pagada.
              </p>
              <div className="referral-summary-stats">
                <div>
                  <span>Saldo actual</span>
                  <strong>${Number(auth?.user.balance ?? 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span>Confirmados</span>
                  <strong>{confirmedReferrals}</strong>
                </div>
                <div>
                  <span>Pendientes</span>
                  <strong>{pendingReferrals}</strong>
                </div>
              </div>
              <div className="referral-code-box">
                <span>Tu código</span>
                <strong>{auth?.user.referralCode ?? "Sin código"}</strong>
              </div>
            </article>

            <article className="card referral-list-card">
              <h3>Historial de referidos</h3>
              <p className="muted">{referrals.length} referido(s) registrados.</p>
              <ul className="data-list referral-list">
                {referrals.length === 0 ? (
                  <li>
                    <strong>Sin referidos todavía</strong>
                    <span>Comparte tu código para empezar a acumular saldo.</span>
                  </li>
                ) : (
                  referrals.map((referral) => (
                    <li key={referral.id}>
                      <div className="referral-item-header">
                        <strong>{referral.referredShop?.name ?? "Shop referido"}</strong>
                        <span className={`status-pill ${referral.status === "confirmed" ? "is-success" : "is-warning"}`}>
                          {referral.status}
                        </span>
                      </div>
                      <span>
                        {referral.referredShop?.slug ?? "sin-slug"} · ${referral.commissionAmount.toFixed(2)} MXN
                      </span>
                      <span>
                        Código: {referral.referralCodeUsed}
                        {referral.providerPaymentId ? ` · Pago: ${referral.providerPaymentId}` : ""}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </article>
          </div>

          <div className="console-grid forms-grid">
            <form className="card form-card" onSubmit={handleCreateCustomer}>
              <h3>Crear cliente</h3>
              <label>
                Nombre
                <input
                  value={customerForm.fullName}
                  onChange={(event) => setCustomerForm({ ...customerForm, fullName: event.target.value })}
                  required
                />
              </label>
              <label>
                Teléfono
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

            <form className="card form-card" onSubmit={handleCreateOrder}>
              <h3>Crear orden</h3>
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
          </div>
        </div>

        {isBlocked ? (
          <SubscriptionGuard
            planName={auth?.subscription.planName}
            priceMxn={auth?.subscription.priceMxn}
          />
        ) : null}
      </div>
    </section>
  );
}
