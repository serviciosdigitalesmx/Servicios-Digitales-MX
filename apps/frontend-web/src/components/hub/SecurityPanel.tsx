"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';
import { useUpdateShopSettings } from '@/hooks/useUpdateShopSettings';
import { supabase } from '@/lib/supabase';

export default function BusinessSettings() {
  const [micrositeEnabled, setMicrositeEnabled] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const { updateSettings, updating } = useUpdateShopSettings();
  const [saved, setSaved] = useState(false);

  // 1. Cargamos el estado inicial y el ID del taller desde la sesión
  useEffect(() => {
    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: shop } = await supabase
          .from('shops')
          .select('id, is_microsite_enabled')
          .eq('owner_id', user.id)
          .single();
        
        if (shop) {
          setShopId(shop.id);
          setMicrositeEnabled(shop.is_microsite_enabled);
        }
      }
    }
    loadInitialData();
  }, []);

  // 2. Función para disparar el guardado real
  const handleSave = async () => {
    if (!shopId) return;
    const result = await updateSettings(shopId, { isMicrositeEnabled: micrositeEnabled });
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white text-left">Configuración</h2>
        <p className="text-gray-500 text-sm uppercase tracking-widest font-bold text-left">Control de presencia digital</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card del Switch Micrositio */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500">
            <Globe className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-black text-white uppercase italic">Micrositio Premium</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Define si tu URL pública muestra el marketing completo o solo el rastreador.
            </p>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
              {micrositeEnabled ? "LANDING + RASTREO" : "SOLO RASTREO"}
            </span>
            <button 
              onClick={() => setMicrositeEnabled(!micrositeEnabled)}
              className={`w-14 h-8 rounded-full transition-all p-1 ${micrositeEnabled ? 'bg-orange-600' : 'bg-gray-800'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform ${micrositeEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Info Placeholder para WhatsApp (Lectura) */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 opacity-40">
          <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center text-green-500">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-black text-white uppercase italic">WhatsApp Link</h3>
            <p className="text-gray-500 text-sm">Destino de las cotizaciones del micrositio.</p>
          </div>
          <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-left text-gray-600 font-bold">
            Configurado en perfil
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={handleSave}
          disabled={updating}
          className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {updating ? (
            <> <Loader2 className="w-4 h-4 animate-spin" /> GUARDANDO... </>
          ) : saved ? (
            <> <CheckCircle2 className="w-4 h-4" /> ¡ACTUALIZADO! </>
          ) : (
            "GUARDAR CAMBIOS"
          )}
        </button>
      </div>
    </div>
  );
}
