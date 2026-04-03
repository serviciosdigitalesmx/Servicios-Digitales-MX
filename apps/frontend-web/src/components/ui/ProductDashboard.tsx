"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "../../lib/apiClient";
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

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["operativo", "tecnico", "archivo", "sucursales", "stock", "clientes", "proveedores", "compras", "gastos", "finanzas", "reportes", "solicitudes", "tareas"],
  manager: ["operativo", "tecnico", "archivo", "stock", "clientes", "proveedores", "compras", "gastos", "reportes", "solicitudes", "tareas"], 
  receptionist: ["operativo", "archivo", "clientes", "solicitudes", "tareas"], 
  technician: ["tecnico", "archivo", "tareas"] 
};

type ProductDashboardProps = {
  initialModule?: ModuleKey;
  shopSlug?: string;
};

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
  const router = useRouter();
  const { session } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [branchFilter, setBranchFilter] = useState("GLOBAL");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleKey>(initialModule);

  const businessName = session?.shop?.name?.trim() || "SR. FIX";
  const subscriptionStatus = session?.subscription?.status?.toUpperCase() || "ADMIN";
  let userRole = (session?.user?.role || "technician").toLowerCase();
  if (userRole === "admin") userRole = "owner";
  
  const allowedModules = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS["technician"];
  const currentModule = MODULES.find((module) => module.key === activeModule) ?? MODULES[0];
  const moduleLabel = currentModule.label;
  const hasAccess = allowedModules.includes(activeModule);

  useEffect(() => {
    setActiveModule(initialModule);
  }, [initialModule]);

  useEffect(() => {
    async function loadBranches() {
      if (!session?.shop.id) return;
      const response = await fetchWithAuth("/api/branches");
      const payload = await response.json();
      if (!response.ok) return;
      const data = Array.isArray(payload?.data) ? payload.data : [];
      setBranches(data);
    }
    void loadBranches();
    setBranchFilter(localStorage.getItem("srfix_sucursal_activa") || "GLOBAL");
  }, [session]);

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

  const handleModuleSelect = (moduleKey: ModuleKey) => {
    setActiveModule(moduleKey);

    startTransition(() => {
      router.replace(moduleLinkMap[moduleKey], { scroll: false });
    });
  };

  const navigationGroups = [
    { group: "Principal", items: MODULES.filter(m => ["operativo", "tecnico", "archivo"].includes(m.key) && allowedModules.includes(m.key)) },
    { group: "Administración", items: MODULES.filter(m => ["sucursales", "stock", "clientes", "proveedores", "compras", "gastos", "finanzas", "reportes"].includes(m.key) && allowedModules.includes(m.key)) },
    { group: "Mostrador", items: MODULES.filter(m => ["solicitudes", "tareas"].includes(m.key) && allowedModules.includes(m.key)) }
  ].filter(group => group.items.length > 0);

  return (
    <div className="sdmx-admin-body">
      <aside className={`sdmx-admin-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sdmx-sidebar-header">
          <div className="sdmx-sidebar-logo-box"><IconWrench width={20} height={20} /></div>
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
                 <button
                   key={module.key}
                   type="button"
                   onClick={() => handleModuleSelect(module.key)}
                   className={`sdmx-sidebar-link ${activeModule === module.key ? "is-active" : ""}`}
                   title={`${module.label} · ${module.summary}`}
                 >
                   <div style={{width: '24px', display: 'flex', justifyContent: 'center'}}>{getIconForModule(module.key)}</div>
                   {isSidebarOpen && <span>{module.label}</span>}
                 </button>
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

      <main style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
        <header className="sdmx-topbar">
          <div className="sdmx-topbar-left">
            <button className="sdmx-topbar-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}><IconMenu width={20} height={20} /></button>
            <div className="sdmx-topbar-divider"></div>
            <h2 className="sdmx-topbar-title">{moduleLabel}</h2>
          </div>

          <div className="sdmx-topbar-right">
             <div className="sdmx-branch-selector">
                <IconStore width={14} height={14} style={{color: '#94a3b8'}} />
                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                   <option value="GLOBAL">Sucursal: Todas</option>
                   {branches.map(b => <option key={b.id} value={b.id}>Sucursal: {b.name}</option>)}
                </select>
             </div>
             <div className="sdmx-user-profile">
                <div className="sdmx-user-info">
                   <p className="sdmx-user-name">{businessName}</p>
                   <p className="sdmx-user-role">{subscriptionStatus}</p>
                </div>
                <div className="sdmx-user-avatar"><IconUser width={16} height={16} /></div>
             </div>
          </div>
        </header>

        <section className="sdmx-workspace sdmx-scrollbar">
          <div className="sdmx-workspace-container">
            {!session?.subscription?.operationalAccess ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-[#E53E3E]/20" style={{minHeight: '60vh'}}>
                 <div className="w-20 h-20 bg-[#E53E3E]/10 flex items-center justify-center rounded-full mb-6 text-4xl">🔒</div>
                 <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Acceso Operativo Suspendido</h2>
                 <p className="text-[#4A5568] max-w-md mb-8">Tu suscripción actual no permite el acceso a las funciones operativas del taller. Por favor regulariza tu estado de facturación para restaurar el tablero.</p>
                 <a href="/billing" className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-8 py-3 rounded-xl font-bold transition">Ir a Facturación</a>
              </div>
            ) : !hasAccess ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-[#E2E8F0]" style={{minHeight: '60vh'}}>
                 <div className="w-20 h-20 bg-[#E2E8F0] flex items-center justify-center rounded-full mb-6 text-4xl">⛔</div>
                 <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Permiso Denegado</h2>
                 <p className="text-[#4A5568] max-w-md mb-8">Tu rol actual corporativo (<strong className="uppercase">{userRole}</strong>) carece de los privilegios necesarios para acceder a este módulo.</p>
                 <a href="/interno" className="bg-[#1A202C] hover:bg-[#2D3748] text-white px-8 py-3 rounded-xl font-bold transition">Volver al autorizado</a>
              </div>
            ) : activeModule === "operativo" ? <OperativoNative /> 
              : activeModule === "tecnico" ? <TecnicoNative />
              : activeModule === "solicitudes" ? <SolicitudesNative />
              : activeModule === "archivo" ? <ArchivoNative />
              : activeModule === "clientes" ? <ClientesNative />
              : activeModule === "tareas" ? <TareasNative />
              : activeModule === "stock" ? <StockNative />
              : activeModule === "proveedores" ? <ProveedoresNative />
              : activeModule === "compras" ? <ComprasNative />
              : activeModule === "gastos" ? <GastosNative />
              : activeModule === "finanzas" ? <FinanzasNative />
              : activeModule === "reportes" ? <ReportesNative />
              : activeModule === "sucursales" ? <SucursalesNative />
              : <div className="p-12 text-center text-[#64748b]">Módulo en preparación...</div>
            }
          </div>
        </section>
      </main>
    </div>
  );
}
