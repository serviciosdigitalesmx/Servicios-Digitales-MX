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
import { 
  IconDashboard, IconWrench, IconInvoice, IconArchive, IconUsers, 
  IconTasks, IconBoxes, IconTruck, IconCart, IconReceipt, 
  IconWallet, IconChart, IconStore, IconMenu, IconUser, IconLogOut 
} from "./Icons";
import { useAuth } from "./AuthGuard";

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
const MASTER_PASSWORD = process.env.NEXT_PUBLIC_LEGACY_PASS || "";

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

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["operativo", "tecnico", "archivo", "sucursales", "stock", "clientes", "proveedores", "compras", "gastos", "finanzas", "reportes", "solicitudes", "tareas"],
  manager: ["operativo", "tecnico", "archivo", "stock", "clientes", "proveedores", "compras", "gastos", "reportes", "solicitudes", "tareas"], 
  receptionist: ["operativo", "archivo", "clientes", "solicitudes", "tareas"], 
  technician: ["tecnico", "archivo", "tareas"] 
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
    throw new Error(data?.error?.message ?? "Error de conexión con la infraestructura interna");
  }

  return data as T;
}

type ProductDashboardProps = {
  initialModule?: ModuleKey;
  shopSlug?: string;
};

// Map each module to a React SVG Icon component
const getIconForModule = (key: string, props: React.SVGProps<SVGSVGElement> = {}) => {
  const defaultProps = { width: 20, height: 20, ...props, style: {margin: '0 auto', ...props.style} };
  
  switch (key) {
    case "operativo": return <IconDashboard {...defaultProps} />;
    case "tecnico": return <IconWrench {...defaultProps} />;
    case "solicitudes": return <IconInvoice {...defaultProps} />;
    case "archivo": return <IconArchive {...defaultProps} />;
    case "clientes": return <IconUsers {...defaultProps} />;
    case "tareas": return <IconTasks {...defaultProps} />;
    case "stock": return <IconBoxes {...defaultProps} />;
    case "proveedores": return <IconTruck {...defaultProps} />;
    case "compras": return <IconCart {...defaultProps} />;
    case "gastos": return <IconReceipt {...defaultProps} />;
    case "finanzas": return <IconWallet {...defaultProps} />;
    case "reportes": return <IconChart {...defaultProps} />;
    case "sucursales": return <IconStore {...defaultProps} />;
    default: return <IconDashboard {...defaultProps} />;
  }
};

export function ProductDashboard({ initialModule = "operativo", shopSlug }: ProductDashboardProps) {
  const { session } = useAuth();
  const auth = session as AuthMeResponse["data"];
  
  const [branchFilter, setBranchFilter] = useState("GLOBAL");
  const [message, setMessage] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const businessName = auth?.shop?.name?.trim() || "SR. FIX";
  let userRole = (auth?.user?.role || "technician").toLowerCase();
  if (userRole === "admin") userRole = "owner";
  
  const allowedModules = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS["technician"];
  
  const currentModule = MODULES.find((module) => module.key === initialModule) ?? MODULES[0];
  const moduleLabel = currentModule.label;
  const hasAccess = allowedModules.includes(initialModule);

  useEffect(() => {
    sessionStorage.setItem("srfix_pass_master", MASTER_PASSWORD);
    sessionStorage.setItem("srfix_pass_operativo", MASTER_PASSWORD);
    sessionStorage.setItem("srfix_pass_tecnico", MASTER_PASSWORD);

    const savedBranch = localStorage.getItem("srfix_sucursal_activa") || "GLOBAL";
    localStorage.setItem("srfix_sucursal_activa", savedBranch);
    setBranchFilter(savedBranch);
  }, []);

  useEffect(() => {
    localStorage.setItem("srfix_sucursal_activa", branchFilter || "GLOBAL");
  }, [branchFilter]);

  const moduleLinkMap = useMemo(
    () =>
      Object.fromEntries(
        MODULES.map((module) => [
          module.key,
          module.key === "operativo" 
            ? `/interno${shopSlug ? `?shop=${shopSlug}` : ''}`
            : `/interno?modulo=${encodeURIComponent(module.key)}${shopSlug ? `&shop=${shopSlug}` : ''}`
        ])
      ) as Record<ModuleKey, string>,
    [shopSlug]
  );

  const iframeSrc = useMemo(() => {
    const src = LEGACY_SRC[initialModule];
    const baseSrc = `${src}?from=sdmx`;
    return shopSlug ? `${baseSrc}&shop=${encodeURIComponent(shopSlug)}` : baseSrc;
  }, [initialModule, shopSlug]);

  const navigationGroups = [
    {
      group: "Principal",
      items: MODULES.filter(m => ["operativo", "tecnico", "archivo"].includes(m.key) && allowedModules.includes(m.key))
    },
    {
      group: "Administración",
      items: MODULES.filter(m => ["sucursales", "stock", "clientes", "proveedores", "compras", "gastos", "finanzas", "reportes"].includes(m.key) && allowedModules.includes(m.key))
    },
    {
      group: "Mostrador",
      items: MODULES.filter(m => ["solicitudes", "tareas"].includes(m.key) && allowedModules.includes(m.key))
    }
  ].filter(group => group.items.length > 0);

  return (
    <div className="sdmx-admin-body">
      
      {/* SIDEBAR */}
      <aside className={`sdmx-admin-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sdmx-sidebar-header">
          <div className="sdmx-sidebar-logo-box">
             <IconWrench width={20} height={20} />
          </div>
          {isSidebarOpen && (
            <div className="sdmx-sidebar-brand" style={{animation: 'fade-in 0.5s ease'}}>
              <div style={{display: 'flex', alignItems: 'center', lineHeight: 1}}>
                 <span>SR</span><span className="fix">FIX</span>
              </div>
              <span className="sdmx-sidebar-subtitle">Management Pro</span>
            </div>
          )}
        </div>

        <nav className="sdmx-sidebar-nav sdmx-scrollbar">
          {navigationGroups.map((group, idx) => (
            <div key={idx} style={{marginBottom: '0.5rem'}}>
               {isSidebarOpen && <div className="sdmx-sidebar-group-label">{group.group}</div>}
               {group.items.map((module) => (
                 <a
                   key={module.key}
                   href={moduleLinkMap[module.key]}
                   className={`sdmx-sidebar-link ${initialModule === module.key ? "is-active" : ""}`}
                   title={`${module.label} · ${module.summary}`}
                 >
                   <div style={{width: '24px', display: 'flex', justifyContent: 'center'}}>
                     {getIconForModule(module.key)}
                   </div>
                   {isSidebarOpen && <span>{module.label}</span>}
                 </a>
               ))}
            </div>
          ))}
        </nav>

        <div className="sdmx-sidebar-footer">
           <a href="/hub" className="sdmx-logout-btn">
              <IconLogOut width={18} height={18} />
              {isSidebarOpen && <span className="sdmx-logout-text">Volver al Hub</span>}
           </a>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
        
        {/* TOPBAR */}
        <header className="sdmx-topbar">
          <div className="sdmx-topbar-left">
            <button className="sdmx-topbar-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <IconMenu width={20} height={20} />
            </button>
            <div className="sdmx-topbar-divider"></div>
            <h2 className="sdmx-topbar-title">{moduleLabel}</h2>
          </div>

          <div className="sdmx-topbar-right">
             <div className="sdmx-branch-selector">
                <IconStore width={14} height={14} style={{color: '#94a3b8'}} />
                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                   <option value="GLOBAL">Sucursal: Todas</option>
                   <option value="MATRIZ">Sucursal: Matriz</option>
                </select>
             </div>

             <div className="sdmx-user-profile">
                <div className="sdmx-user-info">
                   <p className="sdmx-user-name">{businessName}</p>
                   <p className="sdmx-user-role">{auth?.subscription.status || "Admin"}</p>
                </div>
                <div className="sdmx-user-avatar">
                   <IconUser width={16} height={16} />
                </div>
             </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <section className="sdmx-workspace sdmx-scrollbar">
          <div className="sdmx-workspace-container">
            {message && (
              <div style={{background: '#fffbeb', color: '#d97706', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600}}>
                {message}
              </div>
            )}

            {!auth.subscription.operationalAccess ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-[#E53E3E]/20" style={{minHeight: '60vh'}}>
                 <div className="w-20 h-20 bg-[#E53E3E]/10 flex items-center justify-center rounded-full mb-6 text-4xl">
                    🔒
                 </div>
                 <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Acceso Operativo Suspendido</h2>
                 <p className="text-[#4A5568] max-w-md mb-8">
                   Tu suscripción actual no permite el acceso a las funciones operativas del taller. Por favor regulariza tu estado de facturación para restaurar el tablero.
                 </p>
                 <a href="/billing" className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-8 py-3 rounded-xl font-bold transition">
                   Ir a Facturación
                 </a>
              </div>
            ) : !hasAccess ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-[#E2E8F0]" style={{minHeight: '60vh'}}>
                 <div className="w-20 h-20 bg-[#E2E8F0] flex items-center justify-center rounded-full mb-6 text-4xl">
                    ⛔
                 </div>
                 <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Permiso Denegado</h2>
                 <p className="text-[#4A5568] max-w-md mb-8">
                   Tu rol actual corporativo (<strong className="uppercase">{userRole}</strong>) carece de los privilegios necesarios para acceder a este módulo. Si crees que esto es un error, contacta al administrador o dueño del taller.
                 </p>
                 <a href="/interno" className="bg-[#1A202C] hover:bg-[#2D3748] text-white px-8 py-3 rounded-xl font-bold transition">
                   Volver al espacio autorizado
                 </a>
              </div>
            ) : initialModule === "operativo" ? (
              <OperativoNative />
            ) : initialModule === "tecnico" ? (
              <TecnicoNative />
            ) : initialModule === "solicitudes" ? (
              <SolicitudesNative />
            ) : initialModule === "archivo" ? (
              <ArchivoNative />
            ) : initialModule === "clientes" ? (
              <ClientesNative />
            ) : initialModule === "tareas" ? (
              <TareasNative />
            ) : initialModule === "stock" ? (
              <StockNative />
            ) : initialModule === "proveedores" ? (
              <ProveedoresNative />
            ) : initialModule === "compras" ? (
              <ComprasNative />
            ) : initialModule === "gastos" ? (
              <GastosNative />
            ) : initialModule === "finanzas" ? (
              <FinanzasNative />
            ) : initialModule === "reportes" ? (
              <ReportesNative />
            ) : initialModule === "sucursales" ? (
              <SucursalesNative />
            ) : (
              <div style={{width: '100%', minHeight: 'calc(100vh - 140px)', background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)'}}>
                 <iframe
                   key={`${initialModule}-${branchFilter}`}
                   style={{width: '100%', height: '100%', border: 'none'}}
                   title={`Modulo ${initialModule}`}
                   src={iframeSrc}
                 />
              </div>
            )}
          </div>
        </section>
        
      </main>
    </div>
  );
}
