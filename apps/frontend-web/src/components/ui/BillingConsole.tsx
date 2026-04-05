"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth, AuthMeResponse } from "./AuthGuard";
import { apiFetch } from "../../lib/api";

import { PlanLevel, PLAN_METADATA } from "../../lib/subscription";

type BillingPlan = {
  code: PlanLevel;
  name: string;
  priceMxn: number;
  billingInterval: string;
  modules: string[];
};

const DEFAULT_BILLING_PLANS: BillingPlan[] = [
  {
    code: PlanLevel.INICIAL,
    name: 'Plan Inicial',
    priceMxn: 0,
    billingInterval: "monthly",
    modules: ["Clientes", "Operativo Básico", "Portal por folio"]
  },
  {
    code: PlanLevel.PROFESIONAL,
    name: 'Plan Profesional',
    priceMxn: 350,
    billingInterval: "monthly",
    modules: ["Todo lo del Inicial", "Notas Privadas", "Rastreo de IP (Seguridad)"]
  },
  {
    code: PlanLevel.AVANZADO,
    name: 'Plan Avanzado',
    priceMxn: 450,
    billingInterval: "monthly",
    modules: ["Todo lo del Profesional", "Semáforo 48h", "Evidencia Fotográfica", "PDF de Entrega"]
  },
  {
    code: PlanLevel.INTEGRAL,
    name: 'Plan Integral',
    priceMxn: 550,
    billingInterval: "monthly",
    modules: ["Todo lo del Avanzado", "Control de Stock", "Flujo de Caja (Finanzas)"]
  }
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getStatusCopy(status: string) {
  switch (status) {
    case "active":
      return { label: "Activa", tone: "is-success", description: "La operación del local está habilitada y al corriente." };
    case "trialing":
      return { label: "En prueba", tone: "is-info", description: "El local está operativo dentro de su ventana de activación inicial." };
    case "past_due":
      return { label: "Pago vencido", tone: "is-warning", description: "Hay saldo pendiente, pero aún existe una ventana corta para regularizar." };
    case "suspended":
      return { label: "Suspendida", tone: "is-danger", description: "La operación interna está bloqueada hasta que se regularice el pago." };
    case "cancelled":
      return { label: "Cancelada", tone: "is-danger", description: "La suscripción ya no tiene continuidad comercial." };
    default:
      return { label: status, tone: "is-neutral", description: "Estado comercial pendiente de revisión." };
  }
}

export function BillingConsole({ initialPlanCode }: { initialPlanCode?: PlanLevel }) {
  const { session } = useAuth();
  const auth = session as AuthMeResponse | null;
  const [loading, setLoading] = useState(false);
  const [targetPlan, setTargetPlan] = useState<BillingPlan | null>(null);
  const [view, setView] = useState<"overview" | "checkout">("overview");
  
  const [plans, setPlans] = useState<BillingPlan[]>(DEFAULT_BILLING_PLANS);
  const [selectedPlanCode, setSelectedPlanCode] = useState<PlanLevel>(initialPlanCode ?? PlanLevel.PROFESIONAL);
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (initialPlanCode && auth) {
      const planToBuy = DEFAULT_BILLING_PLANS.find(p => p.code === initialPlanCode);
      if (planToBuy && auth.subscription.planCode !== planToBuy.code) {
        setTargetPlan(planToBuy);
        setView("checkout");
      }
    }
  }, [initialPlanCode, auth]);

  useEffect(() => {
    if (initialPlanCode) {
      setSelectedPlanCode(initialPlanCode);
    }
  }, [initialPlanCode]);

  const statusCopy = useMemo(
    () => getStatusCopy(auth?.subscription.status ?? "unknown"),
    [auth?.subscription.status]
  );

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0] ?? null;
  }, [plans, selectedPlanCode]);

  async function handleCheckout() {
    if (!selectedPlan || !auth) return;
    
    setPaying(true);
    setMessage("");

    try {
      const res = await apiFetch("/api/payments/create", {
        method: "POST",
        body: JSON.stringify({
          planCode: selectedPlan.code,
          tenantId: auth.shop.id,
          amount: selectedPlan.priceMxn
        }),
      });

      const data = await (res as any).json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || "Error al crear la preferencia de pago");
      }
    } catch (err: any) {
      console.error("❌ Error en checkout:", err);
      setMessage(`Ocurrió un error: ${err.message}`);
    } finally {
      setPaying(false);
    }
  }

  if (auth && !["owner", "admin"].includes(auth.user.role.toLowerCase())) {
    return (
      <section className="billing-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-[#E2E8F0]" style={{maxWidth: '500px'}}>
           <div className="w-20 h-20 bg-[#E2E8F0] flex items-center justify-center rounded-full mb-6 text-4xl">
              ⛔
           </div>
           <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Acceso Denegado</h2>
           <p className="text-[#4A5568] mb-8">
             El módulo de Facturación y Planes es de carácter administrativo y exclusivo para el dueño. Tu puesto (<strong className="uppercase">{auth.user.role}</strong>) no tiene permisos para consultar información comercial o modificar suscripciones.
           </p>
           <a href="/hub" className="bg-[#1A202C] hover:bg-[#2D3748] text-white px-8 py-3 rounded-xl font-bold transition">
             Volver al Hub
           </a>
        </div>
      </section>
    );
  }

  return (
    <section className="billing-shell">
      <div className="billing-hero" style={{ position: 'relative' }}>
        <a href="/hub" style={{ position: 'absolute', top: '-30px', left: '0', color: '#0066FF', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>← Volver al Hub</a>
        <span className="hero-eyebrow">Cuenta y Suscripción</span>
        <h1>Control comercial del Shop</h1>
        <p>
          Revisa el estado de la suscripción, el monto mensual, el periodo actual y el acceso
          operativo del local.
        </p>
      </div>

      {message ? (
        <div className="console-message is-warning">{message}</div>
      ) : null}

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
        <span className="billing-kicker">Plan seleccionado</span>
        <h3>{selectedPlan?.name ?? auth?.subscription.planName ?? "Plan Esencial"}</h3>
        <p className="billing-price">{selectedPlan ? formatMoney(selectedPlan.priceMxn) : auth ? formatMoney(auth.subscription.priceMxn) : "$350 MXN"}<small>/mes</small></p>
        <dl className="billing-facts compact">
          <div>
            <dt>Código</dt>
            <dd>{selectedPlan?.code ?? auth?.subscription.planCode ?? "esencial-350"}</dd>
          </div>
          <div>
            <dt>Periodo</dt>
            <dd>{selectedPlan?.billingInterval ?? auth?.subscription.billingInterval ?? "monthly"}</dd>
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
              {paying
                ? "Redirigiendo..."
                : `Contratar ${selectedPlan?.name ?? "plan"}`}
            </button>
          </div>
          <p className="billing-footnote">
            El pago será procesado de forma segura a través de Mercado Pago.
          </p>
        </article>
      </div>

      <article className="card billing-card billing-card-wide">
        <div className="billing-card-header">
          <div>
            <span className="billing-kicker">Planes disponibles</span>
            <h3>Elige cómo quieres operar tu negocio</h3>
          </div>
        </div>
        <div className="billing-plan-grid">
          {plans.map((plan) => (
            <button
              key={plan.code}
              type="button"
              className={`billing-plan-option ${selectedPlanCode === plan.code ? "is-selected" : ""}`}
              onClick={() => setSelectedPlanCode(plan.code)}
            >
              <span className="billing-plan-name">{plan.name}</span>
              <strong>{formatMoney(plan.priceMxn)}<small>/mes</small></strong>
              <ul>
                {plan.modules.map((module) => (
                  <li key={module}>{module}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </article>

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
