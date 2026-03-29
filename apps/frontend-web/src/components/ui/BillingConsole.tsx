"use client";

import { useEffect, useMemo, useState } from "react";

type AuthMeResponse = {
  data: {
    user: {
      id: string;
      fullName: string;
      email: string;
      role: string;
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
    lastPayment?: {
      id: string;
      provider: string;
      providerPaymentId: string;
      providerPaymentStatus: string;
      amount?: number;
      currencyId?: string;
      payerEmail?: string;
      paidAt: string;
      createdAt: string;
    } | null;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "No se pudo cargar la información de billing");
  }

  return data as T;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) return "Sin registro";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getStatusCopy(status: string) {
  switch (status) {
    case "active":
      return {
        label: "Activa",
        tone: "is-success",
        description: "La operación del local está habilitada y al corriente."
      };
    case "trialing":
      return {
        label: "En prueba",
        tone: "is-info",
        description: "El local está operativo dentro de su ventana de activación inicial."
      };
    case "past_due":
      return {
        label: "Pago vencido",
        tone: "is-warning",
        description: "Hay saldo pendiente, pero aún existe una ventana corta para regularizar."
      };
    case "suspended":
      return {
        label: "Suspendida",
        tone: "is-danger",
        description: "La operación interna está bloqueada hasta que se regularice el pago."
      };
    case "cancelled":
      return {
        label: "Cancelada",
        tone: "is-danger",
        description: "La suscripción ya no tiene continuidad comercial."
      };
    default:
      return {
        label: status,
        tone: "is-neutral",
        description: "Estado comercial pendiente de revisión."
      };
  }
}

export function BillingConsole() {
  const [auth, setAuth] = useState<AuthMeResponse["data"] | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetchJson<AuthMeResponse>("/api/auth/me");
        setAuth(response.data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No se pudo cargar la cuenta");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const statusCopy = useMemo(
    () => getStatusCopy(auth?.subscription.status ?? "unknown"),
    [auth?.subscription.status]
  );

  async function handleCheckout() {
    setMessage("");
    setPaying(true);

    try {
      const response = await fetchJson<{ data: { checkoutUrl: string } }>("/api/billing/checkout-preference", {
        method: "POST"
      });
      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar el checkout");
      setPaying(false);
    }
  }

  return (
    <section className="billing-shell">
      <div className="billing-hero">
        <span className="hero-eyebrow">Cuenta y Suscripción</span>
        <h1>Control comercial del Shop</h1>
        <p>
          Revisa el estado de la suscripción, el monto mensual, el periodo actual y el acceso
          operativo del local.
        </p>
      </div>

      {message ? <div className="console-message">{message}</div> : null}

      <div className="billing-grid">
        <article className="card billing-card billing-card-primary">
          <div className="billing-card-header">
            <div>
              <span className="billing-kicker">Shop</span>
              <h2>{auth?.shop.name ?? "Cargando..."}</h2>
            </div>
            <span className={`status-pill ${statusCopy.tone}`}>{statusCopy.label}</span>
          </div>
          <p className="billing-description">{statusCopy.description}</p>
          <dl className="billing-facts">
            <div>
              <dt>Slug</dt>
              <dd>{auth?.shop.slug ?? "..."}</dd>
            </div>
            <div>
              <dt>Administrador</dt>
              <dd>{auth?.user.fullName ?? "..."}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{auth?.user.email ?? "..."}</dd>
            </div>
            <div>
              <dt>Acceso operativo</dt>
              <dd>{auth ? (auth.subscription.operationalAccess ? "Habilitado" : "Suspendido") : "..."}</dd>
            </div>
          </dl>
        </article>

        <article className="card billing-card">
          <span className="billing-kicker">Plan actual</span>
          <h3>{auth?.subscription.planName ?? "Plan Base"}</h3>
          <p className="billing-price">{auth ? formatMoney(auth.subscription.priceMxn) : "$350 MXN"}<small>/mes</small></p>
          <dl className="billing-facts compact">
            <div>
              <dt>Código</dt>
              <dd>{auth?.subscription.planCode ?? "base-350"}</dd>
            </div>
            <div>
              <dt>Periodo</dt>
              <dd>{auth?.subscription.billingInterval ?? "monthly"}</dd>
            </div>
            <div>
              <dt>Inicio</dt>
              <dd>{formatDate(auth?.subscription.currentPeriodStart)}</dd>
            </div>
            <div>
              <dt>Corte</dt>
              <dd>{formatDate(auth?.subscription.currentPeriodEnd)}</dd>
            </div>
            <div>
              <dt>Gracia</dt>
              <dd>{formatDate(auth?.subscription.graceUntil)}</dd>
            </div>
          </dl>
        </article>

        <article className="card billing-card">
          <span className="billing-kicker">Acciones</span>
          <h3>Regularizar cuenta</h3>
          <p className="billing-description">
            Este espacio ya está listo para conectarse al flujo real de cobro, validación y
            reactivación automática.
          </p>
          <div className="billing-actions">
            <a
              className="billing-button is-primary"
              href="https://wa.me/528181234567?text=Hola%2C%20quiero%20pagar%20o%20reactivar%20mi%20suscripci%C3%B3n%20de%20Servicios%20Digitales%20MX."
              target="_blank"
              rel="noreferrer"
            >
              Contactar a Soporte
            </a>
            <button
              className="billing-button is-secondary"
              type="button"
              onClick={() => void handleCheckout()}
              disabled={paying || loading}
            >
              {paying ? "Redirigiendo..." : "Pagar Ahora"}
            </button>
          </div>
          <p className="billing-footnote">
            El pago sale por Mercado Pago Checkout Pro en modo de prueba.
          </p>
        </article>
      </div>

      <article className="card billing-card billing-card-wide">
        <div className="billing-card-header">
          <div>
            <span className="billing-kicker">Último pago acreditado</span>
            <h3>
              {auth?.lastPayment
                ? `${formatMoney(auth.lastPayment.amount ?? auth.subscription.priceMxn)} confirmado`
                : "Aún no hay pagos registrados"}
            </h3>
          </div>
          {auth?.lastPayment ? (
            <span className={`status-pill ${getStatusCopy(auth.lastPayment.providerPaymentStatus).tone}`}>
              {getStatusCopy(auth.lastPayment.providerPaymentStatus).label}
            </span>
          ) : null}
        </div>
        <dl className="billing-facts compact">
          <div>
            <dt>Referencia de pago</dt>
            <dd>{auth?.lastPayment?.providerPaymentId ?? "Sin referencia"}</dd>
          </div>
          <div>
            <dt>Proveedor</dt>
            <dd>{auth?.lastPayment?.provider ?? "Mercado Pago"}</dd>
          </div>
          <div>
            <dt>Fecha acreditada</dt>
            <dd>{formatDateTime(auth?.lastPayment?.paidAt)}</dd>
          </div>
          <div>
            <dt>Monto</dt>
            <dd>
              {auth?.lastPayment
                ? formatMoney(auth.lastPayment.amount ?? auth.subscription.priceMxn)
                : "Sin monto"}
            </dd>
          </div>
          <div>
            <dt>Correo pagador</dt>
            <dd>{auth?.lastPayment?.payerEmail ?? "No disponible"}</dd>
          </div>
        </dl>
      </article>

      <article className="card billing-card billing-notes">
        <span className="billing-kicker">Estado técnico</span>
        <h3>Backend listo para enforcement</h3>
        <ul className="billing-note-list">
          <li>El backend ya bloquea rutas operativas cuando la suscripción cae en `suspended`.</li>
          <li>`auth/me` ya expone el estado comercial del Shop en tiempo real.</li>
          <li>El portal público por folio se mantiene abierto aunque la operación interna se bloquee.</li>
        </ul>
      </article>

      {loading ? <div className="billing-loading">Cargando cuenta...</div> : null}
    </section>
  );
}
