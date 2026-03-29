"use client";

import { useEffect, useMemo, useState } from "react";
import { MODULES, type ModuleKey } from "../../lib/module-registry";
import { ClientesNative } from "./ClientesNative";
import { ComprasNative } from "./ComprasNative";
import { FinanzasNative } from "./FinanzasNative";
import { GastosNative } from "./GastosNative";
import { OperativoNative } from "./OperativoNative";
import { ProveedoresNative } from "./ProveedoresNative";
import { ArchivoNative } from "./ArchivoNative";
import { ReportesNative } from "./ReportesNative";
import { SolicitudesNative } from "./SolicitudesNative";
import { SucursalesNative } from "./SucursalesNative";
import { StockNative } from "./StockNative";
import { TecnicoNative } from "./TecnicoNative";
import { TareasNative } from "./TareasNative";

type AuthMeResponse = {
  data: {
    user: {
      fullName: string;
      role: string;
    };
    shop: {
      name: string;
      slug: string;
    };
    subscription: {
      status: string;
      operationalAccess: boolean;
    };
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5111";
const LEGACY_BASE_PATH = "/legacy-srfix";
const MASTER_PASSWORD = "Admin1";

const LEGACY_SRC: Record<ModuleKey, string> = {
  operativo: `${LEGACY_BASE_PATH}/panel-operativo.html`,
  tecnico: `${LEGACY_BASE_PATH}/panel-tecnico.html`,
  solicitudes: `${LEGACY_BASE_PATH}/panel-solicitudes.html`,
  archivo: `${LEGACY_BASE_PATH}/panel-archivo.html`,
  clientes: `${LEGACY_BASE_PATH}/panel-clientes.html`,
  tareas: `${LEGACY_BASE_PATH}/panel-tareas.html`,
  stock: `${LEGACY_BASE_PATH}/panel-stock.html`,
  proveedores: `${LEGACY_BASE_PATH}/panel-proveedores.html`,
  compras: `${LEGACY_BASE_PATH}/panel-compras.html`,
  gastos: `${LEGACY_BASE_PATH}/panel-gastos.html`,
  finanzas: `${LEGACY_BASE_PATH}/panel-finanzas.html`,
  reportes: `${LEGACY_BASE_PATH}/panel-reportes.html`,
  sucursales: `${LEGACY_BASE_PATH}/panel-sucursales.html`
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "No se pudo cargar el integrador");
  }

  return data as T;
}

type ProductDashboardProps = {
  initialModule?: ModuleKey;
};

export function ProductDashboard({ initialModule = "operativo" }: ProductDashboardProps) {
  const [branchFilter, setBranchFilter] = useState("GLOBAL");
  const [auth, setAuth] = useState<AuthMeResponse["data"] | null>(null);
  const [message, setMessage] = useState("");
  const businessName = auth?.shop.name?.trim() || "SR. FIX";
  const businessSubtitle = auth?.shop.slug
    ? `Panel interno · ${auth.shop.slug}`
    : "Soluciones en Tecnología";
  const moduleLabel = MODULES.find((module) => module.key === initialModule)?.label ?? "Operativo";

  useEffect(() => {
    sessionStorage.setItem("srfix_pass_master", MASTER_PASSWORD);
    sessionStorage.setItem("srfix_pass_operativo", MASTER_PASSWORD);
    sessionStorage.setItem("srfix_pass_tecnico", MASTER_PASSWORD);

    const savedBranch = localStorage.getItem("srfix_sucursal_activa") || "GLOBAL";
    localStorage.setItem("srfix_sucursal_activa", savedBranch);
    setBranchFilter(savedBranch);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const authData = await fetchJson<AuthMeResponse>("/api/auth/me");
        setAuth(authData.data);
        setMessage("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No se pudo cargar el contexto del shop");
      }
    }

    void load();
  }, []);

  useEffect(() => {
    localStorage.setItem("srfix_sucursal_activa", branchFilter || "GLOBAL");
  }, [branchFilter]);

  const moduleLinkMap = useMemo(
    () =>
      Object.fromEntries(
        MODULES.map((module) => [
          module.key,
          module.key === "operativo" ? "/interno" : `/interno?modulo=${encodeURIComponent(module.key)}`
        ])
      ) as Record<ModuleKey, string>,
    []
  );

  const iframeSrc = useMemo(() => {
    const src = LEGACY_SRC[initialModule];
    return `${src}?from=sdmx`;
  }, [initialModule]);

  return (
    <section className="integrator-shell">
      <div className="samii-shell">
        <aside className="samii-sidebar">
          <div className="samii-sidebar-top">
            <a className="samii-sidebar-brand" href="/interno">
              <img className="samii-sidebar-logo" src="/logo-srfix.webp" alt="SR. FIX" />
            </a>

            <div className="samii-business-chip">
              <img className="samii-business-avatar" src="/logo-srfix.webp" alt={businessName} />
              <div>
                <strong>{businessName}</strong>
                <span>{auth?.subscription.status ?? "sin estado"}</span>
              </div>
            </div>

            <select
              className="samii-branch-select"
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
            >
              <option value="GLOBAL">Sucursal | todas</option>
              <option value="MATRIZ">Sucursal | matriz</option>
            </select>
          </div>

          <nav className="samii-sidebar-nav" aria-label="Módulos principales">
            {MODULES.map((module) => (
              <a
                key={module.key}
                className={`samii-sidebar-link ${initialModule === module.key ? "is-active" : ""}`}
                href={moduleLinkMap[module.key]}
                title={module.label}
              >
                <span className="samii-sidebar-icon" />
                <span>{module.label}</span>
              </a>
            ))}
          </nav>

          <div className="samii-sidebar-bottom">
            <a className="samii-sidebar-ghost" href="/billing">
              Billing
            </a>
          </div>
        </aside>

        <div className="samii-main">
          <header className="samii-topbar">
            <div className="samii-topbar-title">
              <strong>{businessName}</strong>
              <span>{moduleLabel} · {businessSubtitle}</span>
            </div>

            <div className="samii-topbar-actions">
              <input
                className="samii-search"
                type="search"
                placeholder="Buscar en órdenes, clientes, folios o módulos"
              />
              <a className="samii-topbar-button" href="/billing">
                Planes
              </a>
            </div>
          </header>

          <section className="samii-surface">
            {message ? <div className="console-message">{message}</div> : null}

            {initialModule === "operativo" ? (
              <section className="integrator-native-shell">
                <OperativoNative />
              </section>
            ) : initialModule === "tecnico" ? (
              <section className="integrator-native-shell">
                <TecnicoNative />
              </section>
            ) : initialModule === "solicitudes" ? (
              <section className="integrator-native-shell">
                <SolicitudesNative />
              </section>
            ) : initialModule === "archivo" ? (
              <section className="integrator-native-shell">
                <ArchivoNative />
              </section>
            ) : initialModule === "clientes" ? (
              <section className="integrator-native-shell">
                <ClientesNative />
              </section>
            ) : initialModule === "tareas" ? (
              <section className="integrator-native-shell">
                <TareasNative />
              </section>
            ) : initialModule === "stock" ? (
              <section className="integrator-native-shell">
                <StockNative />
              </section>
            ) : initialModule === "proveedores" ? (
              <section className="integrator-native-shell">
                <ProveedoresNative />
              </section>
            ) : initialModule === "compras" ? (
              <section className="integrator-native-shell">
                <ComprasNative />
              </section>
            ) : initialModule === "gastos" ? (
              <section className="integrator-native-shell">
                <GastosNative />
              </section>
            ) : initialModule === "finanzas" ? (
              <section className="integrator-native-shell">
                <FinanzasNative />
              </section>
            ) : initialModule === "reportes" ? (
              <section className="integrator-native-shell">
                <ReportesNative />
              </section>
            ) : initialModule === "sucursales" ? (
              <section className="integrator-native-shell">
                <SucursalesNative />
              </section>
            ) : (
              <section className="integrator-iframe-shell">
                <iframe
                  key={`${initialModule}-${branchFilter}`}
                  className="integrator-iframe"
                  title={`Modulo ${initialModule}`}
                  src={iframeSrc}
                />
              </section>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
