"use client";

import React, { useState } from "react";
import { useAuth } from "./AuthGuard";
import { PlanLevel, PLAN_HIERARCHY, PLAN_METADATA } from "../../lib/subscription";
import { IconLock, IconStar } from "./Icons";
import { apiFetch } from "../../lib/api";

interface FeatureGuardProps {
  requiredLevel: PlanLevel;
  featureName: string;
  children: React.ReactNode;
  variant?: 'default' | 'compact';
}

export function FeatureGuard({ requiredLevel, featureName, children, variant = 'default' }: FeatureGuardProps) {
  const { session } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const userPlanCode = (session?.subscription?.planCode as PlanLevel) || PlanLevel.INICIAL;
  
  const userPlanIndex = PLAN_HIERARCHY.indexOf(userPlanCode);
  const requiredPlanIndex = PLAN_HIERARCHY.indexOf(requiredLevel);

  const isLocked = userPlanIndex < requiredPlanIndex;

  if (!isLocked) {
    return <>{children}</>;
  }

  if (variant === 'compact') {
    return (
      <>
        <span 
          onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            cursor: 'pointer',
            opacity: 0.7,
            filter: 'blur(1px)',
            transition: 'all 0.2s'
          }}
          title={`Característica Premium: ${featureName}. Haz clic para mejorar tu plan.`}
        >
          {children}
          <span style={{ fontSize: '10px' }}>🔒</span>
        </span>
        {showUpgrade && (
          <UpgradeModal 
            requiredLevel={requiredLevel} 
            onClose={() => setShowUpgrade(false)} 
          />
        )}
      </>
    );
  }

  return (
    <div className="relative group overflow-hidden rounded-3xl transition-all duration-500">
      {/* Visual Lock Overlay */}
      <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 cursor-pointer"
             onClick={() => setShowUpgrade(true)}>
          <IconStar width={18} height={18} className="text-blue-600" />
          Activar {featureName}
        </div>
      </div>

      {/* Locked Content View */}
      <div className="opacity-40 grayscale-[0.5] pointer-events-none select-none">
        <div className="absolute top-4 right-4 z-20 bg-slate-800/80 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
          <IconLock width={16} height={16} className="text-slate-400" />
        </div>
        {children}
      </div>

      {/* Tooltip on mouse over */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Disponible en {PLAN_METADATA[requiredLevel].name}
      </div>

      {showUpgrade && (
        <UpgradeModal 
          requiredLevel={requiredLevel} 
          onClose={() => setShowUpgrade(false)} 
        />
      )}
    </div>
  );
}

interface UpgradeModalProps {
  requiredLevel: PlanLevel;
  onClose: () => void;
}

export function UpgradeModal({ requiredLevel, onClose }: UpgradeModalProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const userPlanCode = (session?.subscription?.planCode as PlanLevel) || PlanLevel.INICIAL;
  const currentPlan = PLAN_METADATA[userPlanCode];
  const targetPlan = PLAN_METADATA[requiredLevel];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/payments/create", {
        method: "POST",
        body: JSON.stringify({
          planCode: requiredLevel,
          tenantId: session?.shop.id,
          amount: targetPlan.price
        }),
      });
      const data = await (res as any).json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con la pasarela de pagos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1E293B] border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-scaleUp">
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-blue-500 font-black text-xs uppercase tracking-[0.2em] mb-2 block">Crecimiento sin límites</span>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Potencia tu Taller</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              ✕
            </button>
          </div>

          <p className="text-slate-400 font-medium mb-10 leading-relaxed">
            Estás a un paso de profesionalizar tu operación. Activa las herramientas que los talleres líderes utilizan para dominar el mercado.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Plan Actual</span>
              <h4 className="text-lg font-bold text-white mb-2">{currentPlan.name}</h4>
              <p className="text-xs text-slate-500">Plan limitado</p>
            </div>
            <div className="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/30 ring-1 ring-blue-500/20">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 block">Próximo Nivel</span>
              <h4 className="text-lg font-bold text-white mb-2">{targetPlan.name}</h4>
              <p className="text-2xl font-black text-white">${targetPlan.price}<small className="text-xs text-blue-400 font-bold">/mes</small></p>
            </div>
          </div>

          <div className="space-y-4 mb-10">
             <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Lo que obtendrás:</h4>
             {targetPlan.features.map(f => (
               <div key={f} className="flex items-center gap-3">
                 <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <IconStar width={10} height={10} className="text-emerald-500" />
                 </div>
                 <span className="text-sm text-slate-300 font-medium">{f}</span>
               </div>
             ))}
          </div>

          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
          >
            {loading ? "Preparando pago..." : "Actualizar ahora con Mercado Pago"}
          </button>
          
          <p className="text-center text-[11px] text-slate-500 mt-6 font-bold tracking-tight uppercase">
            Pago seguro procesado por Mercado Pago • Facturación automática
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleUp { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  )
}
