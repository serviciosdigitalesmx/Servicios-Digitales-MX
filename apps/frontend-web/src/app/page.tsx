import Link from 'next/link';
import { Shield, Zap, barChart as BarChart, Globe, Smartphone, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-blue-500/30">
      {/* Navbar Premium */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic">S</div>
          <span className="text-xl font-black tracking-tighter italic">SRFIX <span className="text-blue-600">PRO</span></span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">INICIAR SESIÓN</Link>
          <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-full font-black text-xs tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20">
            CONVIERTE TU TALLER
          </Link>
        </div>
      </nav>

      {/* Hero Section Agresivo */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent -z-10" />
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase">
            <Zap size={12} fill="currentColor" /> El futuro de la microelectrónica
          </div>
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
            DOMINA TU <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-300">LABORATORIO</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            La plataforma líder en México para técnicos de élite. Control total de reparaciones, finanzas y stock con ADN profesional.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
             <Link href="/login" className="bg-orange-500 hover:bg-orange-600 px-10 py-5 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl shadow-orange-500/20 uppercase">
                Empezar Prueba Gratuita
             </Link>
             <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-10 py-5 rounded-2xl font-black text-sm tracking-widest transition-all uppercase">
                Ver Demo En Vivo
             </button>
          </div>
        </div>
      </section>

      {/* Planes de Precios (Los de tus fotos) */}
      <section className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Planes que escalan tu negocio</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sin contratos forzosos. Cancela cuando quieras.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan Inicial */}
            <div className="bg-[#161616] p-10 rounded-[40px] border border-white/5 hover:border-blue-500/30 transition-all group">
              <h3 className="text-blue-500 font-black text-xs tracking-[0.3em] uppercase mb-4">Membresía Básica</h3>
              <div className="text-5xl font-black mb-8">$350 <span className="text-sm text-gray-600 font-bold">/mes</span></div>
              <ul className="space-y-4 mb-10 text-sm font-bold text-gray-400">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> 1 Sucursal</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> Panel Técnico</li>
                <li className="flex items-center gap-3 opacity-30"><CheckCircle2 size={18} /> Reportes PDF</li>
              </ul>
              <Link href="/login" className="block text-center py-4 rounded-2xl bg-white/5 group-hover:bg-blue-600 transition-all font-black text-xs tracking-widest uppercase">Seleccionar</Link>
            </div>

            {/* Plan Pro (El de la foto) */}
            <div className="bg-[#161616] p-10 rounded-[40px] border-2 border-blue-600 relative overflow-hidden transform md:-translate-y-4 shadow-2xl shadow-blue-600/10">
              <div className="absolute top-0 right-0 bg-blue-600 px-6 py-2 text-[10px] font-black tracking-widest uppercase rounded-bl-2xl">Más Popular</div>
              <h3 className="text-blue-500 font-black text-xs tracking-[0.3em] uppercase mb-4">Membresía Pro</h3>
              <div className="text-5xl font-black mb-8">$549 <span className="text-sm text-gray-600 font-bold">/mes</span></div>
              <ul className="space-y-4 mb-10 text-sm font-bold text-gray-200">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> 3 Sucursales</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> Inventario Inteligente</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> Finanzas Pro</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> Multi-usuario</li>
              </ul>
              <Link href="/login" className="block text-center py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all font-black text-xs tracking-widest uppercase">Impulsa tu Taller</Link>
            </div>

            {/* Plan Master */}
            <div className="bg-[#161616] p-10 rounded-[40px] border border-white/5 hover:border-blue-500/30 transition-all group">
              <h3 className="text-blue-500 font-black text-xs tracking-[0.3em] uppercase mb-4">Membresía Master</h3>
              <div className="text-5xl font-black mb-8">$850 <span className="text-sm text-gray-600 font-bold">/mes</span></div>
              <ul className="space-y-4 mb-10 text-sm font-bold text-gray-400">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> Sucursales Ilimitadas</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> Personalización Total</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-600" /> Soporte VIP 24/7</li>
              </ul>
              <Link href="/login" className="block text-center py-4 rounded-2xl bg-white/5 group-hover:bg-blue-600 transition-all font-black text-xs tracking-widest uppercase">Contacto</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} Servicios Digitales MX · SRFIX PRO · Monterrey, N.L.
      </footer>
    </div>
  );
}
