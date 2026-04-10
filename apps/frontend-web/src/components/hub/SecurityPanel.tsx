"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  UserPlus, 
  Edit3, 
  Settings, 
  Activity, 
  X, 
  Save, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Database,
  Smartphone
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface InternalUser {
  usuario: string;
  nombre: string;
  rol: 'admin' | 'supervisor' | 'operativo' | 'tecnico';
  activo: boolean;
  notas?: string;
}

interface SecurityAction {
  clave: string;
  titulo: string;
  descripcion: string;
  requiereAdmin: boolean;
}

const MOCK_USERS: InternalUser[] = [
  { usuario: 'admin', nombre: 'Jesús Villa', rol: 'admin', activo: true, notas: 'Super Administrador' },
  { usuario: 'carlos_t', nombre: 'Carlos Torres', rol: 'tecnico', activo: true, notas: 'Taller Principal' },
  { usuario: 'brenda_l', nombre: 'Brenda Luna', rol: 'operativo', activo: true, notas: 'Recepción Matutina' },
  { usuario: 'invitado', nombre: 'User Demo', rol: 'operativo', activo: false },
];

const MOCK_ACTIONS: SecurityAction[] = [
  { clave: 'eliminar_orden', titulo: 'Eliminar Órden de Servicio', descripcion: 'Permite borrar permanentemente un folio del sistema.', requiereAdmin: true },
  { clave: 'modificar_caja', titulo: 'Ajustar Caja Manual', descripcion: 'Permite editar ingresos/egresos ya cerrados.', requiereAdmin: true },
  { clave: 'ver_finanzas', titulo: 'Acceso a Finanzas', descripcion: 'Ver utilidades, egresos y reportes fiscales.', requiereAdmin: true },
  { clave: 'editar_stock', titulo: 'Modificar Stock Manual', descripcion: 'Cambiar cantidades de inventario sin folio de compra.', requiereAdmin: false },
];

export default function SecurityPanel() {
  const [users, setUsers] = useState<InternalUser[]>(MOCK_USERS);
  const [actions, setActions] = useState<SecurityAction[]>(MOCK_ACTIONS);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InternalUser | null>(null);
  
  // Simulation for Admin check
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in zoom-in duration-500">
         <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[32px] flex items-center justify-center text-red-500 mb-8 shadow-2xl">
            <ShieldAlert size={48} />
         </div>
         <h2 className="text-3xl font-jakarta font-black text-white mb-4">Acceso Restringido</h2>
         <p className="max-w-md text-text-secondary font-medium tracking-tight">
           Tu cuenta no tiene privilegios de nivel <span className="text-red-500 font-bold uppercase tracking-widest">Administrador</span> para acceder a la configuración de seguridad del sistema.
         </p>
         <button className="mt-10 btn-accent px-10 py-4 text-xs font-black uppercase tracking-widest">
            Solicitar Autorización
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl gap-6">
        <div>
          <h1 className="text-3xl font-jakarta font-black text-white tracking-tight">Centro de Control de Seguridad</h1>
          <p className="text-text-secondary text-sm font-bold uppercase tracking-[0.3em] mt-1">Configuración técnica y gestión de identidades</p>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <div className="hidden sm:flex items-center gap-3 bg-green-500/10 px-6 py-3 rounded-2xl border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] shadow-inner">
              <CheckCircle2 size={16} /> Sistema Encriptado (TLS)
           </div>
           <button className="bg-white/5 hover:bg-white/10 p-3.5 rounded-2xl border border-white/10 text-text-secondary hover:text-white transition-all shadow-inner">
             <RotateCcw size={20} />
           </button>
        </div>
      </header>

      {/* Security KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Usuarios Internos', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Políticas Activas', value: actions.filter(a => a.requiereAdmin).length, icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Bitácora Activa', value: 'SÍ', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Riesgo Global', value: 'NULO', icon: Fingerprint, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 border-white/5 flex items-center justify-between hover:scale-[1.02] transition-all">
             <div>
                <div className="text-2xl font-jakarta font-black text-white mb-0.5">{stat.value}</div>
                <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{stat.label}</div>
             </div>
             <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon size={20} />
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         
         {/* User Management Section */}
         <section className="space-y-6">
            <div className="flex justify-between items-end">
               <div>
                  <h3 className="text-lg font-jakarta font-black text-white">Gestión de Usuarios</h3>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Cuentas con acceso al Hub</p>
               </div>
               <button 
                 onClick={() => { setSelectedUser(null); setShowUserModal(true); }}
                 className="flex items-center gap-2 text-[10px] font-black text-accent-blue uppercase tracking-widest hover:underline"
                >
                  <UserPlus size={14} /> Crear Acceso
               </button>
            </div>

            <div className="space-y-4">
               {users.map((u) => (
                 <div key={u.usuario} className="bg-black/40 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-text-secondary font-bold group-hover:text-accent-blue transition-colors border border-white/5">
                          {u.nombre[0]}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white tracking-tight">{u.nombre}</p>
                          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">{u.usuario} · <span className="text-accent-blue">{u.rol}</span></p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", u.activo ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20")}>
                          {u.activo ? 'Activo' : 'Suspendido'}
                       </span>
                       <button 
                         onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                         className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white transition-all shadow-inner"
                        >
                          <Edit3 size={16} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </section>

         {/* Permissions & Global Config Section */}
         <section className="space-y-8">
            <div className="space-y-6">
               <div>
                  <h3 className="text-lg font-jakarta font-black text-white">Políticas de Autorización</h3>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Acciones que requieren clave admin</p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {actions.map((a) => (
                    <label key={a.clave} className="flex items-start gap-4 p-5 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all cursor-pointer group">
                       <input type="checkbox" checked={a.requiereAdmin} readOnly className="mt-1 w-5 h-5 rounded-lg border-2 border-white/10 bg-transparent checked:bg-accent-orange checked:border-accent-orange transition-all appearance-none cursor-pointer" />
                       <div>
                          <p className="text-xs font-black text-white group-hover:text-accent-orange transition-colors uppercase tracking-widest领先">{a.titulo}</p>
                          <p className="text-[9px] text-text-secondary font-medium leading-relaxed mt-1">{a.descripcion}</p>
                       </div>
                    </label>
                  ))}
               </div>
            </div>

            {/* Global Settings */}
            <div className="glass-card p-10 border-white/5 bg-accent-orange/[0.02] space-y-8">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center text-accent-orange border border-accent-orange/20">
                     <Settings size={20} />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Avanzado</h3>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Clave Administradora Actual</label>
                     <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input type="password" placeholder="••••••••" className="w-full input-srf p-4 pl-12 text-center tracking-[1em]" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <button className="flex-1 btn-accent py-4 flex items-center justify-center gap-3">
                        <Save size={18} /> Guardar Cambios
                     </button>
                     <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] shadow-inner">
                        Auditar Bitácora
                     </button>
                  </div>
               </div>
            </div>
         </section>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => setShowUserModal(false)} 
        />
      )}
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: InternalUser | null, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-[#121214] border border-white/10 w-full max-w-2xl rounded-[40px] shadow-3xl overflow-hidden relative flex flex-col scale-in h-[90vh]">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue border border-accent-blue/20">
                 <Users size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-jakarta font-black text-white">
                  {user ? `Configurar: ${user.usuario}` : 'Crear Nuevo Usuario'}
                </h3>
              </div>
           </div>
           <button onClick={onClose} className="p-4 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-all">
             <X size={28} />
           </button>
        </div>

        <div className="p-12 space-y-10 overflow-y-auto scrollbar-hide flex-1">
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Usuario / Login</label>
                 <input type="text" className="w-full input-srf p-4 font-mono font-bold" placeholder="ej: carlos_t" defaultValue={user?.usuario} />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Rol de Acceso</label>
                 <select className="w-full input-srf p-4 appearance-none cursor-pointer" defaultValue={user?.rol}>
                   <option value="operativo">Operativo</option>
                   <option value="tecnico">Técnico</option>
                   <option value="supervisor">Supervisor</option>
                   <option value="admin">Administrador</option>
                 </select>
              </div>
              <div className="col-span-2 space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Nombre Completo</label>
                 <input type="text" className="w-full input-srf p-4" placeholder="Nombre real del colaborador..." defaultValue={user?.nombre} />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Nueva Contraseña</label>
                 <div className="relative">
                    <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="password" placeholder="••••••••" className="w-full input-srf p-4 pl-12" />
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Estado de Cuenta</label>
                 <select className="w-full input-srf p-4" defaultValue={user?.activo ? 'SI' : 'NO'}>
                   <option value="SI">ACTIVO</option>
                   <option value="NO">SUSPENDIDO</option>
                 </select>
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Notas de Auditoría</label>
              <textarea rows={3} className="w-full input-srf p-4 text-xs" placeholder="Motivo de creación, sucursal asignada, etc..." defaultValue={user?.notas} />
           </div>
           
           <div className="bg-red-500/5 p-8 rounded-3xl border border-red-500/10 space-y-4">
              <div className="flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest">
                 <ShieldAlert size={14} /> Zona de Alta Seguridad
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Clave Admin Actual (Para Guardar)</label>
                 <input type="password" placeholder="••••••••" className="w-full input-srf p-4 text-center tracking-[1em]" />
              </div>
           </div>
        </div>

        <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
           <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl transition-all border border-white/5 text-[10px] font-black uppercase tracking-widest shadow-inner">
             Cancelar
           </button>
           <button className="flex-2 btn-accent py-5 flex items-center justify-center gap-3">
             <Save size={20} /> Guardar Usuario
           </button>
        </div>
      </div>
    </div>
  );
}
