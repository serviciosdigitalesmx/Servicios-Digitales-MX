"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Wrench } from "lucide-react";

export default function ReceptionForm() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-card p-10 shadow-2xl relative overflow-hidden bg-black/40 border border-white/10 rounded-[32px] text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/20 flex items-center justify-center text-amber-300 mb-8">
          <AlertTriangle size={40} />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-300 mb-4">
          Flujo legado detectado
        </p>

        <h1 className="text-3xl font-black text-white mb-4">
          Esta recepción ya no debe usarse
        </h1>

        <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Este formulario pertenecía al flujo heredado de SrFix y estaba generando órdenes
          fuera del modelo operativo oficial. Para evitar folios falsos, tablas viejas y
          duplicidad de lógica, la recepción oficial ahora debe hacerse desde el módulo
          operativo real.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left max-w-2xl mx-auto mb-10">
          <div className="flex items-start gap-4">
            <Wrench className="text-blue-400 mt-1" size={22} />
            <div>
              <p className="text-white font-bold mb-2">Ruta correcta</p>
              <p className="text-slate-400 text-sm">
                Usa el flujo oficial en <span className="font-mono text-white">/interno</span>,
                dentro del módulo <strong>Operativo</strong>, que ya trabaja con
                <span className="font-mono text-white"> service_orders</span>,
                clientes reales y estructura alineada a Supabase.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/interno"
            className="btn-accent flex items-center justify-center gap-3"
          >
            Ir a Operativo Oficial <ArrowRight size={18} />
          </Link>

          <Link
            href="/hub"
            className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all border border-white/10"
          >
            Volver al Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
