import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white">
      {/* Hero Section / Presentación */}
      <nav className="p-6 flex justify-between items-center border-b border-blue-500/10">
        <h2 className="text-xl font-black text-blue-500 italic">SDMX <span className="text-white">PRO</span></h2>
        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full font-bold text-sm transition-all">
          INICIAR SESIÓN
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-6 uppercase">
          Gestión Inteligente para <br/> <span className="text-blue-500">Microelectrónica</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-12">
          La plataforma definitiva para técnicos y laboratorios. Control de inventario, finanzas y reportes en un solo lugar.
        </p>

        {/* Sección de Precios / Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-[#161B2C] p-8 rounded-3xl border border-blue-500/10 hover:border-blue-500/40 transition-all">
            <h3 className="font-bold text-blue-500 mb-2 uppercase tracking-widest">Básico</h3>
            <p className="text-4xl font-black mb-6">$0 <span className="text-sm text-gray-500">/mes</span></p>
            <ul className="text-sm text-gray-400 space-y-3 mb-8 text-left">
              <li>• Gestión de 1 sucursal</li>
              <li>• Registro de reparaciones</li>
              <li>• Soporte comunitario</li>
            </ul>
          </div>

          <div className="bg-[#161B2C] p-8 rounded-3xl border-2 border-blue-600 shadow-2xl shadow-blue-600/10 scale-105">
            <h3 className="font-bold text-blue-500 mb-2 uppercase tracking-widest">Premium</h3>
            <p className="text-4xl font-black mb-6">$499 <span className="text-sm text-gray-500">/mes</span></p>
            <ul className="text-sm text-gray-400 space-y-3 mb-8 text-left">
              <li>• Todo el control técnico</li>
              <li>• Finanzas y Stock Pro</li>
              <li>• Facturación automática</li>
            </ul>
            <Link href="/register" className="block bg-blue-600 w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs">Empieza Ya</Link>
          </div>

          <div className="bg-[#161B2C] p-8 rounded-3xl border border-blue-500/10 hover:border-blue-500/40 transition-all">
            <h3 className="font-bold text-blue-500 mb-2 uppercase tracking-widest">Enterprise</h3>
            <p className="text-4xl font-black mb-6">Custom</p>
            <ul className="text-sm text-gray-400 space-y-3 mb-8 text-left">
              <li>• Sucursales ilimitadas</li>
              <li>• API personalizada</li>
              <li>• Soporte 24/7 VIP</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
