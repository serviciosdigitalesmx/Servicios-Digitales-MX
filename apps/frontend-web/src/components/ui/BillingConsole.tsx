"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, AuthMeResponse } from "./AuthGuard";

type BillingPlan = {
  code: string;
  name: string;
  priceMxn: number;
  billingInterval: string;
  modules: string[];
};

const DEFAULT_BILLING_PLANS: BillingPlan[] = [
  {
    code: "esencial-350",
    name: "Plan Esencial",
    priceMxn: 350,
    billingInterval: "monthly",
    modules: ["Operativo", "Técnico", "Solicitudes", "Clientes", "Portal por folio"]
  },
  {
    code: "profesional-650",
    name: "Plan Profesional",
    priceMxn: 650,
    billingInterval: "monthly",
    modules: ["Todo lo del Esencial", "Stock", "Compras", "Proveedores", "Gastos", "Reportes"]
  },
  {
    code: "elite-1200",
    name: "Plan Elite",
    priceMxn: 1200,
    billingInterval: "monthly",
    modules: ["Todo lo del Profesional", "Multi-sucursal", "Branding", "Dashboard ejecutivo"]
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

export function BillingConsole({ initialPlanCode }: { initialPlanCode?: string }) {
  const { session } = useAuth();
  const auth = session as AuthMeResponse | null;
  const [loading, setLoading] = useState(false);
  const [targetPlan, setTargetPlan] = useState<BillingPlan | null>(null);
  const [view, setView] = useState<"overview" | "checkout">("overview");

  const [plans, setPlans] = useState<BillingPlan[]>(DEFAULT_BILLING_PLANS);
  const [selectedPlanCode, setSelectedPlanCode] = useState(initialPlanCode ?? "esencial-350");
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

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        const response = await fetch("/api/payments/plans", { cache: "no-store" });
        const data = await response.json();
        const remotePlans = data?.data;

        if (!cancelled && Array.isArray(remotePlans) && remotePlans.length > 0) {
          setPlans(remotePlans);
        }
      } catch (error) {
        console.warn("No se pudieron cargar planes remotos, usando catálogo local.", error);
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusCopy = useMemo(
    () => getStatusCopy(auth?.subscription.status ?? "unknown"),
    [auth?.subscription.status]
  );

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0] ?? null;
  }, [plans, selectedPlanCode]);

  async function handleCheckout() {
    if (!auth || !selectedPlan) {
      setMessage("No pudimos resolver la cuenta o el plan seleccionado.");
      return;
    }

    try {
      setPaying(true);
      setMessage("");

      const response = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planCode: selectedPlan.code,
          tenantId: auth.shop.id,
          email: auth.user.email,
          fullName: auth.user.fullName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.error || "No se pudo iniciar el checkout.");
      }

      const checkoutUrl = data?.checkoutUrl ?? data?.init_point;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      throw new Error("El backend no devolvió una URL de checkout.");
    } catch (error: any) {
      setMessage(error.message || "No se pudo iniciar el flujo de cobro.");
    } finally {
      setPaying(false);
    }
  }

  if (auth && !["owner", "admin"].includes(auth.user.role.toLowerCase())) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="sdmx-glass max-w-md w-full p-10 rounded-[2.5rem] border-red-500/20 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-red-600/10 transition-all"></div>
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 flex items-center justify-center rounded-2xl mb-8 mx-auto text-4xl shadow-lg shadow-red-500/5">
            <span className="grayscale contrast-125">⛔</span>
          </div>
          <h2 className="text-2xl font-tech font-black text-white mb-3 uppercase tracking-wider">Acceso Restringido</h2>
          <p className="text-slate-400 font-label font-medium uppercase tracking-widest text-sm mb-10 leading-relaxed">
            Módulo administrativo financiero. Tu rol (<span className="text-red-400">{auth.user.role}</span>) no tiene permisos de gestión comercial.
          </p>
          <a href="/hub" className="block w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-tech text-xs uppercase tracking-[0.2em] transition-all border border-white/5">
            Volver al Panel
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="billing-shell max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12 relative">
        <a href="/hub" className="text-blue-500 hover:text-blue-400 transition-all font-tech text-[10px] uppercase tracking-[0.2em] mb-8 block">
          ← Dashboard Principal
        </a>
        <span className="text-blue-500/60 font-tech text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">Módulo Comercial</span>
        <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 font-tech tracking-wider uppercase">Estado de Cuenta</h1>
        <p className="text-slate-400 font-label font-medium uppercase tracking-widest text-sm leading-relaxed max-w-2xl">
          Control financiero de tu suscripción SaaS. Monitorea cortes, pagos y niveles de acceso operativo.
        </p>
      </div>

      {message ? (
        <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 font-label font-bold uppercase tracking-widest text-center text-xs">
          {message}
        </div>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <article className="sdmx-glass p-8 rounded-[2.5rem] lg:col-span-2 flex flex-col justify-between border-blue-500/10">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-blue-500/60 font-tech text-[10px] uppercase tracking-[0.2em] block mb-1">Empresa Registrada</span>
                <h2 className="text-2xl font-tech font-black text-white tracking-wider uppercase">{auth?.shop.name ?? "..."}</h2>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-tech font-black uppercase tracking-[0.15em] border ${statusCopy.tone === 'is-success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                {statusCopy.label}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed border-l-2 border-white/5 pl-6">
              {statusCopy.description}
            </p>
          </div>

          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/5">
            <div>
              <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest mb-1">Socio</dt>
              <dd className="text-white font-label font-bold text-sm tracking-wide">{auth?.shop.slug}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest mb-1">Admin</dt>
              <dd className="text-white font-label font-bold text-sm tracking-wide truncate">{auth?.user.fullName}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest mb-1">Acceso</dt>
              <dd className={`font-label font-bold text-sm tracking-wide ${auth?.subscription.operationalAccess ? 'text-emerald-400' : 'text-red-400'}`}>
                {auth?.subscription.operationalAccess ? "ACTIVO" : "BLOQUEADO"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest mb-1">Soporte</dt>
              <dd className="text-blue-400 font-label font-bold text-sm tracking-wide">ID-{auth?.shop.id.slice(0, 5)}</dd>
            </div>
          </dl>
        </article>

        <article className="sdmx-glass p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-slate-900 to-slate-950">
          <span className="text-blue-500/60 font-tech text-[10px] uppercase tracking-[0.2em] block mb-6">Plan Contratado</span>
          <h3 className="text-3xl font-tech font-black text-white uppercase tracking-wider mb-2">
            {selectedPlan?.name ?? auth?.subscription.planName ?? "Esencial"}
          </h3>
          <p className="text-4xl font-label font-black text-white mb-10">
            {selectedPlan ? formatMoney(selectedPlan.priceMxn) : auth ? formatMoney(auth.subscription.priceMxn) : "$350"}
            <span className="text-lg text-slate-500 font-medium ml-1">/MXN</span>
          </p>

          <dl className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest">Corte de Mes</dt>
              <dd className="text-white font-label font-bold text-sm">{formatDate(auth?.subscription.currentPeriodEnd)}</dd>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest">Periodo</dt>
              <dd className="text-white font-label font-bold text-sm uppercase tracking-widest">{selectedPlan?.billingInterval ?? "MENSUAL"}</dd>
            </div>
            <div className="flex justify-between items-center py-3">
              <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest">Fecha Gracia</dt>
              <dd className="text-amber-500 font-label font-bold text-sm">{formatDate(auth?.subscription.graceUntil)}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <article className="sdmx-glass p-8 rounded-[2.5rem] border-white/5">
          <h3 className="text-xl font-tech font-black text-white uppercase tracking-wider mb-4">Gestión de Pago</h3>
          <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
            Utiliza la pasarela segura para renovar tu acceso o cambiar de plan. Los cambios se aplican de forma inmediata al detectar el pago.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => void handleCheckout()}
              disabled={paying || loading}
              className="py-4 bg-white hover:bg-blue-600 text-slate-950 hover:text-white rounded-2xl font-tech text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
            >
              {paying ? "Conectando..." : `Contratar ${selectedPlan?.name.split(' ')[1] || "Plan"}`}
            </button>
            <a
              href="https://wa.me/528181234567?text=Soporte%20SDMX"
              target="_blank"
              rel="noreferrer"
              className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-tech text-[10px] uppercase tracking-[0.2em] transition-all text-center border border-white/5"
            >
              Contactar Soporte
            </a>
          </div>
          <p className="mt-6 text-center text-[10px] font-label font-bold text-slate-500 uppercase tracking-widest">
            🔐 Transacción protegida por Mercado Pago
          </p>
        </article>

        <article className="sdmx-glass p-8 rounded-[2.5rem] border-white/5">
          <h3 className="text-xl font-tech font-black text-white uppercase tracking-wider mb-4">Último Pago Confirmado</h3>
          {auth?.lastPayment ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-3xl font-label font-black text-white">
                    {formatMoney(auth.lastPayment.amount ?? auth.subscription.priceMxn)}
                  </p>
                  <p className="text-[10px] font-tech text-emerald-400 uppercase tracking-[0.2em] font-bold mt-1">Suscripción Acreditada</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-2xl border border-white/5">
                  <img src="/mercadopago.svg" alt="MP" className="h-4 opacity-50 grayscale contrast-200" />
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div>
                  <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest mb-1">Referencia</dt>
                  <dd className="text-white font-mono text-[10px] truncate">{auth.lastPayment.providerPaymentId}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-tech text-slate-500 uppercase tracking-widest mb-1">Fecha</dt>
                  <dd className="text-white font-label font-bold text-[11px] truncate">{formatDateTime(auth.lastPayment.paidAt)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <span className="text-4xl mb-4">🧾</span>
              <p className="text-sm font-label font-bold text-slate-400 uppercase tracking-widest text-center">Sin historial de pagos registrados en este local.</p>
            </div>
          )}
        </article>
      </div>

      <article className="sdmx-glass p-10 rounded-[2.5rem] border-blue-500/10 mb-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 py-10">
          <div className="text-center lg:text-left">
            <h3 className="text-3xl font-tech font-black text-white uppercase tracking-wider mb-2">Planes Disponibles</h3>
            <p className="text-slate-400 font-label uppercase tracking-[0.2em] font-bold text-xs">Escala tu negocio con módulos de alta gama</p>
          </div>
          <div className="w-full lg:w-auto grid md:grid-cols-3 gap-6 flex-1 max-w-4xl">
            {plans.map((plan) => (
              <button
                key={plan.code}
                type="button"
                className={`p-8 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${selectedPlanCode === plan.code ? 'bg-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-500/20' : 'bg-slate-900/50 border-white/5 hover:border-white/20 text-slate-300'}`}
                onClick={() => setSelectedPlanCode(plan.code)}
              >
                <span className={`text-[10px] font-tech uppercase tracking-[0.2em] font-bold block mb-4 ${selectedPlanCode === plan.code ? 'text-white/80' : 'text-blue-500'}`}>
                  Plan {plan.name.split(' ')[1]}
                </span>
                <p className="text-2xl font-label font-black mb-1">{formatMoney(plan.priceMxn)}</p>
                <p className="text-[10px] font-tech uppercase tracking-widest opacity-60 mb-6">Monto Mensual</p>
                <ul className="text-[10px] font-label font-bold space-y-2 uppercase tracking-wider opacity-80">
                  {plan.modules.slice(0, 3).map(m => (
                    <li key={m}>+ {m}</li>
                  ))}
                  <li className="italic opacity-50">+ Ver todo</li>
                </ul>
                {selectedPlanCode === plan.code && (
                  <div className="absolute top-2 right-4 text-white text-xs">●</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </article>

      {loading && <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center font-tech text-white uppercase tracking-widest">Sincronizando Cuenta...</div>}
    </section>
  );
}
}
