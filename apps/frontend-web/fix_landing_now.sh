#!/usr/bin/env bash
set -euo pipefail

cd "$HOME/Servicios-Digitales-MX/apps/frontend-web"

mkdir -p ./src/components/ui
mkdir -p ./src/app

cat > ./src/components/ui/MarketingLanding.tsx <<'TSX'
"use client";

const features = [
  "Recepción",
  "Inventario",
  "Finanzas",
  "Clientes",
  "Panel técnico",
  "Folios",
  "Estatus",
  "Mensajería",
  "Estadísticas",
  "Alertas",
];

const plans = [
  {
    name: "Inicial",
    price: "$0",
    desc: "Para arrancar y validar operación.",
    items: ["Clientes", "Operativo básico", "Portal por folio"],
  },
  {
    name: "Profesional",
    price: "$350",
    desc: "Para talleres que ya venden y ocupan control real.",
    items: ["Notas privadas", "Rastreo de IP", "Mayor control interno"],
  },
  {
    name: "Integral",
    price: "$550",
    desc: "Para una operación más completa y escalable.",
    items: ["Stock", "Flujo de caja", "Módulos avanzados"],
  },
];

export function MarketingLanding() {
  return (
    <main className="min-h-screen bg-[#08142c] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08142c]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#inicio" className="text-base font-semibold tracking-wide text-white">
            Servicios Digitales MX
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#inicio" className="text-sm text-white/80 transition hover:text-white">Inicio</a>
            <a href="#caracteristicas" className="text-sm text-white/80 transition hover:text-white">Características</a>
            <a href="#planes" className="text-sm text-white/80 transition hover:text-white">Planes</a>
            <a href="#contacto" className="text-sm text-white/80 transition hover:text-white">Contacto</a>
            <a
              href="#comenzar"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Comenzar
            </a>
          </nav>
        </div>
      </header>

      <section id="inicio" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/70">
            Software para talleres y servicios técnicos
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-7xl">
            Te presentamos el mejor software para administrar tu{" "}
            <span className="text-blue-400">taller de reparación</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Controla clientes, órdenes, finanzas, inventario y seguimiento técnico
            desde una sola plataforma, con una interfaz limpia, clara y profesional.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {features.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#comenzar"
              className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500"
            >
              Comenzar ahora
            </a>
            <a
              href="#planes"
              className="rounded-full border border-white/15 px-6 py-3 font-medium text-white/85 transition hover:bg-white/5"
            >
              Ver planes
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <div className="aspect-[16/9] w-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.25),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 sm:p-10">
            <div className="grid h-full gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0b1c39]/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Recepción</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Alta de equipo</div>
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Cliente vinculado</div>
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Folio automático</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1c39]/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Operación</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Diagnóstico</div>
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Seguimiento técnico</div>
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Estatus por etapa</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1c39]/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Control</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Finanzas</div>
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Inventario</div>
                  <div className="rounded-xl bg-white/5 p-3 text-left text-sm text-white/75">Reportes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="caracteristicas" className="mx-auto max-w-7xl px-6 py-8 sm:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            Características
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Lo que sí le da forma profesional a tu operación
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Control de clientes", "Consulta historial, contacto y trazabilidad en un solo lugar."],
            ["Órdenes y folios", "Recibe equipos, genera folios y da seguimiento sin perder contexto."],
            ["Vista técnica", "El taller ve estatus, prioridades y acciones sin depender de WhatsApp."],
            ["Panel administrativo", "Cruza operación, finanzas y módulos clave desde una sola base."],
          ].map(([title, desc]) => (
            <article
              key={title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-7xl px-6 py-8 sm:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            Planes
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Planes claros, sin hacer ver barata la marca
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-xl"
            >
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-4xl font-extrabold text-blue-400">{plan.price}<span className="text-base font-medium text-white/60"> / mes</span></p>
              <p className="mt-3 text-sm leading-6 text-white/70">{plan.desc}</p>

              <ul className="mt-6 space-y-3 text-sm text-white/80">
                {plan.items.map((item) => (
                  <li key={item} className="rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="comenzar" className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            Comenzar
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Empieza con una base limpia, no con una página improvisada
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Esta versión ya deja la navegación clara, el hero fuerte y la información mejor distribuida.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#contacto"
              className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500"
            >
              Solicitar demo
            </a>
            <a
              href="#planes"
              className="rounded-full border border-white/15 px-6 py-3 font-medium text-white/85 transition hover:bg-white/5"
            >
              Revisar planes
            </a>
          </div>
        </div>
      </section>

      <footer id="contacto" className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>Servicios Digitales MX</p>
          <p>Contacto • WhatsApp • Demo • Implementación</p>
        </div>
      </footer>
    </main>
  );
}
TSX

cat > ./src/app/public-views.css <<'CSS'
html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: #08142c;
}

a {
  text-decoration: none;
}
CSS

echo "===== ARCHIVOS ACTUALIZADOS ====="
echo "./src/components/ui/MarketingLanding.tsx"
echo "./src/app/public-views.css"
echo

echo "===== BUILD ====="
npm run build
