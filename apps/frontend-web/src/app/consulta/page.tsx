'use client';
import { useState, useEffect } from 'react';
import { Search, Smartphone, Clock, Calendar, CheckCircle2, Video, ArrowLeft, Printer, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function PortalCliente() {
  const [folio, setFolio] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'result' | 'error'>('idle');
  const [equipo, setEquipo] = useState<any>(null);

  const buscarFolio = async () => {
    if (!folio) return;
    setLoading(true);
    // Simulación de búsqueda en Supabase/Backend
    setTimeout(() => {
      if (folio.toUpperCase() === 'SR-4922') {
        setEquipo({
          folio: 'SR-4922',
          dispositivo: 'iPhone 13 Pro',
          modelo: 'A2638',
          falla: 'Cambio de pantalla y FaceID',
          estado: 'En Reparación',
          fechaPromesa: '2026-04-12',
          fechaIngreso: '2026-04-09',
          seguimiento: 'Se ha instalado la pantalla original, estamos calibrando los sensores de proximidad.',
          diasRestantes: 3,
          youtubeId: 'dQw4w9WgXcQ' // Ejemplo
        });
        setStatus('result');
      } else {
        setStatus('error');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Portal */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic text-xs">S</div>
            <span className="text-xl font-black tracking-tighter italic">SRFIX <span className="text-blue-600">PORTAL</span></span>
          </div>
          <Link href="/" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white flex items-center gap-2">
            <ArrowLeft size={14} /> Volver al Inicio
          </Link>
        </header>

        {status === 'idle' || status === 'error' ? (
          <div className="text-center space-y-8 py-20 animate-in fade-in zoom-in duration-500">
            <div className="space-y-4">
              <h1 className="text-5xl font-black uppercase tracking-tighter">Consulta tu <br/> <span className="text-blue-500">Reparación</span></h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Ingresa el folio de tu orden de servicio</p>
            </div>
            
            <div className="max-w-md mx-auto relative">
              <input 
                type="text" 
                value={folio}
                onChange={(e) => setFolio(e.target.value.toUpperCase())}
                placeholder="EJ: SR-4922" 
                className="w-full bg-[#161616] border border-white/10 rounded-3xl py-6 px-8 text-2xl font-black text-center focus:border-blue-500 outline-none transition-all placeholder:opacity-20"
              />
              {status === 'error' && <p className="text-red-500 text-[10px] font-black uppercase mt-4 tracking-widest">Folio no encontrado. Verifica tu ticket.</p>}
            </div>

            <button 
              onClick={buscarFolio}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-12 py-5 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Consultando...' : 'Rastrear Equipo'}
            </button>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-700 space-y-6">
            {/* Tarjeta de Resultado Principal */}
            <div className="bg-[#161616] border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 bg-blue-600 px-8 py-3 text-[10px] font-black tracking-widest uppercase rounded-bl-3xl">
                {equipo.estado}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Orden de Servicio</p>
                    <h2 className="text-4xl font-black uppercase">{equipo.folio}</h2>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Equipo</span>
                      <span className="font-black text-white">{equipo.dispositivo}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Falla</span>
                      <span className="font-medium text-gray-300 italic">"{equipo.falla}"</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Entrega Estimada</span>
                      <span className="font-black text-orange-500">{equipo.fechaPromesa}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 rounded-3xl p-8 border border-white/5 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <Clock size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">{equipo.diasRestantes} Días</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Para completar tu entrega</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Notas de Avance</p>
                <p className="text-gray-400 leading-relaxed text-sm bg-white/5 p-6 rounded-2xl border border-white/5 italic">
                  {equipo.seguimiento}
                </p>
              </div>
            </div>

            {/* Live Cam Section */}
            {equipo.youtubeId && (
              <div className="bg-[#161616] border border-white/5 rounded-[40px] p-8 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Reparación en vivo</span>
                </div>
                <div className="aspect-video rounded-3xl overflow-hidden bg-black">
                   <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${equipo.youtubeId}?autoplay=1&mute=1`} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                   ></iframe>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
               <button onClick={() => setStatus('idle')} className="flex-1 bg-white/5 hover:bg-white/10 py-5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all">Nueva Consulta</button>
               <button className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white py-5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3">
                 <Smartphone size={18} /> Contactar Técnico
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
