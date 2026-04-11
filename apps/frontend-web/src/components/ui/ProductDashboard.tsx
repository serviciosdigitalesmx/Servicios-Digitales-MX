"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "../../lib/apiClient";
import { MODULES, type ModuleKey } from "../../lib/module-registry";
import { ClientesNative } from "./ClientesNative";
import { ComprasNative } from "./ComprasNative";
import { ConfiguracionNegocioNative } from "./ConfiguracionNegocioNative";
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
  owner: ["operativo", "tecnico", "archivo", "sucursales", "stock", "clientes", "proveedores", "compras", "gastos", "finanzas", "reportes", "solicitudes", "tareas", "negocio"],
  manager: ["operativo", "tecnico", "archivo", "stock", "clientes", "proveedores", "compras", "gastos", "reportes", "solicitudes", "tareas", "negocio"], 
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
    case "negocio": return <IconStore {...defaultProps} />;
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
      const payload = await (response as any).json();
      if (!(response as any).ok) return;
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
            ? `/hub${shopSlug ? `?shop=${shopSlug}` : ''}`
            : `/hub?modulo=${encodeURIComponent(module.key)}${shopSlug ? `&shop=${shopSlug}` : ''}`
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
    { group: "Administración", items: MODULES.filter(m => ["negocio", "sucursales", "stock", "clientes", "proveedores", "compras", "gastos", "finanzas", "reportes"].includes(m.key) && allowedModules.includes(m.key)) },
    { group: "Mostrador", items: MODULES.filter(m => ["solicitudes", "tareas"].includes(m.key) && allowedModules.includes(m.key)) }
  ].filter(group => group.items.length > 0);

  return (
    <div className="sdmx-admin-body bg-slate-950 min-h-screen text-slate-100">
      <aside className={`sdmx-admin-sidebar border-r border-white/5 transition-all duration-300 ${isSidebarOpen ? 'w-[280px]' : 'w-[80px]'}`} style={{background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)'}}>
        <div className="sdmx-sidebar-header p-6 flex items-center gap-4 border-b border-white/5">
          <div className="sdmx-sidebar-logo-box bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <IconWrench width={20} height={20} className="text-white" />
          </div>
          {isSidebarOpen && (
            <div className="sdmx-sidebar-brand animate-fadeIn">
              <div className="font-tech font-black text-xl flex items-center tracking-tighter">
                 <span className="text-white">SR</span><span className="text-blue-500 italic">FIX</span>
              </div>
              <p className="font-label uppercase tracking-[0.2em] text-[9px] text-slate-500 font-bold leading-none">Management Pro</p>
            </div>
          )}
        </div>

        <nav className="sdmx-sidebar-nav sdmx-scrollbar overflow-y-auto overflow-x-hidden py-4 flex-1">
          {navigationGroups.map((group, idx) => (
            <div key={idx} className="mb-6 px-4">
               {isSidebarOpen && <div className="font-label uppercase tracking-[0.2em] text-[10px] text-slate-600 font-bold mb-4 ml-2">{group.group}</div>}
               <div className="space-y-1">
                 {group.items.map((module) => (
                   <button
                     key={module.key}
                     type="button"
                     onClick={() => handleModuleSelect(module.key)}
                     className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative ${activeModule === module.key ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                     title={module.label}
                   >
                     <div className="shrink-0">{getIconForModule(module.key)}</div>
                     {isSidebarOpen && <span className="font-label font-bold uppercase tracking-wider text-[11px]">{module.label}</span>}
                     {activeModule === module.key && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-glow" />}
                   </button>
                 ))}
               </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
           <a href="/hub" className="flex items-center gap-4 px-4 py-4 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all group overflow-hidden">
              <IconLogOut width={18} height={18} className="shrink-0" />
              {isSidebarOpen && <span className="font-tech text-[10px] uppercase tracking-widest font-black">Panel de Control</span>}
           </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <header className="sdmx-topbar h-[72px] flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-500 hover:text-white transition-colors" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <IconMenu width={20} height={20} />
            </button>
            <div className="w-px h-6 bg-white/10"></div>
            <h2 className="font-tech text-white text-base uppercase tracking-[0.2em]">{moduleLabel}</h2>
          </div>

          <div className="flex items-center gap-6">
             <div className="sdmx-branch-selector bg-slate-800/50 border border-white/5 px-4 py-2 rounded-full flex items-center gap-2">
                <IconStore width={14} height={14} className="text-blue-500" />
                <select className="bg-transparent text-[10px] font-label font-bold text-slate-400 uppercase tracking-widest focus:outline-none cursor-pointer" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                   <option value="GLOBAL">Todas las Sucursales</option>
                   {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
             </div>
             <div className="flex items-center gap-3">
                <div className="text-right">
                   <p className="font-tech text-[10px] text-white uppercase tracking-wider">{businessName}</p>
                   <p className="font-label text-[9px] text-blue-400 font-bold uppercase tracking-widest leading-none mt-1">{subscriptionStatus}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner">
                  <IconUser width={16} height={16} />
                </div>
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-8 sdmx-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {!session?.subscription?.operationalAccess ? (
              <div className="sdmx-glass flex flex-col items-center justify-center p-12 text-center rounded-[3rem] border-red-500/20" style={{minHeight: '60vh'}}>
                 <div className="w-24 h-24 bg-red-500/10 flex items-center justify-center rounded-full mb-8 text-5xl shadow-2xl shadow-red-500/10">🔒</div>
                 <h2 className="font-tech text-3xl text-white uppercase tracking-tighter mb-4">Acceso Operativo Suspendido</h2>
                 <p className="font-label text-slate-400 max-w-md mb-10 text-lg">Tu cuenta requiere regularizar pagos pendientes para restaurar la operación técnica de tus sucursales.</p>
                 <a href="/billing" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-tech text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all transform hover:scale-105">Ir a Facturación</a>
              </div>
            ) : !hasAccess ? (
              <div className="sdmx-glass flex flex-col items-center justify-center p-12 text-center rounded-[3rem] border-white/5" style={{minHeight: '60vh'}}>
                 <div className="w-24 h-24 bg-slate-800 flex items-center justify-center rounded-full mb-8 text-5xl opacity-50">⛔</div>
                 <h2 className="font-tech text-3xl text-white uppercase tracking-tighter mb-4">Módulo de Acceso Restringido</h2>
                 <p className="font-label text-slate-400 max-w-md mb-10 text-lg">Tu perfil de <strong className="text-blue-400 uppercase tracking-widest">{userRole}</strong> no tiene privilegios para visualizar o gestionar este segmento.</p>
                 <a href="/hub" className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-5 rounded-2xl font-tech text-xs uppercase tracking-[0.2em] transition-all">Volver al Dashboard</a>
              </div>
            ) : activeModule === "operativo" ? <OperativoNative tenantId={session?.shop?.id || "default"} /> 
              : activeModule === "tecnico" ? <TecnicoNative tenantId={session?.shop?.id || "default"} />
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
              : activeModule === "negocio" ? <ConfiguracionNegocioNative />
              : activeModule === "sucursales" ? <SucursalesNative />
              : <div className="p-12 text-center font-label text-slate-500 uppercase tracking-[0.3em]">Cabina en Preparación...</div>
            }
          </div>
        </section>
      </main>
    </div>
  );
}
