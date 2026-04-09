"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrderTracking } from "../../../hooks/useOrderTracking";

type ShopBranding = {
  id?: string;
  name?: string;
  slug?: string;
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  supportEmail?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

function normalizeFolio(value: string) {
  return value.trim().toUpperCase();
}

export default function PortalPage() {
  const [input, setInput] = useState("");
  const [submittedFolio, setSubmittedFolio] = useState<string | null>(null);
  const [branding, setBranding] = useState<ShopBranding | null>(null);

  const normalizedInput = useMemo(() => normalizeFolio(input), [input]);
  const { order, loading, error, refresh } = useOrderTracking(submittedFolio);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5115";
        const res = await fetch(`${apiUrl}/api/shop/settings`);
        const payload = await res.json();

        if (payload?.success && payload?.data) {
          setBranding(payload.data);
        } else if (payload?.data) {
          setBranding(payload.data);
        } else if (payload?.name) {
          setBranding(payload);
        }
      } catch (err) {
        console.error("No se pudo cargar branding del portal:", err);
      }
    };

    loadBranding();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedInput) return;
    setSubmittedFolio(normalizedInput);
  };

  const shopName = branding?.name || branding?.legalName || "Tu taller";
  const primaryColor = branding?.primaryColor || "#2563EB";

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <p
            className="text-xs uppercase tracking-[0.3em] font-bold mb-3"
            style={{ color: primaryColor }}
          >
            Portal del cliente
          </p>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Consulta el estatus de tu equipo
          </h1>

          <p className="text-slate-400 mt-3 max-w-2xl">
            Revisa el avance de tu orden con {shopName}. Ingresa tu folio para
            consultar el estado actual, la fecha compromiso y el último movimiento registrado.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej. ORD-1024"
              className="flex-1 rounded-2xl bg-slate-950 border border-slate-700 px-4 py-4 text-white outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!normalizedInput || loading}
              className="rounded-2xl px-6 py-4 font-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? "Consultando..." : "Consultar"}
            </button>
          </form>

          {submittedFolio && (
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
              <span>Folio consultado:</span>
              <span className="font-bold text-white">{submittedFolio}</span>
              {!loading && (
                <button
                  type="button"
                  onClick={() => refresh()}
                  className="font-semibold"
                  style={{ color: primaryColor }}
                >
                  Actualizar
                </button>
              )}
            </div>
          )}
        </div>

        {loading && (
          <section className="mt-6 rounded-3xl border border-blue-900/40 bg-blue-950/20 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300 font-bold mb-2">
              Cargando
            </p>
            <h2 className="text-xl font-black">Estamos consultando tu orden…</h2>
            <p className="text-slate-300 mt-2">
              Estamos trayendo la información más reciente del seguimiento.
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="mt-6 rounded-3xl border border-red-900/40 bg-red-950/20 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-red-300 font-bold mb-2">
              No encontrado / error
            </p>
            <h2 className="text-xl font-black">No pudimos mostrar la orden</h2>
            <p className="text-slate-300 mt-2">{error}</p>
            <p className="text-slate-400 mt-3 text-sm">
              Verifica el folio e inténtalo de nuevo. Si el problema sigue,
              contáctanos por WhatsApp o por el canal de soporte del taller.
            </p>
          </section>
        )}

        {!loading && !error && order && (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.3em] font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  Orden localizada
                </p>
                <h2 className="text-2xl font-black">{order.folio}</h2>
                <p className="text-slate-400 mt-2">
                  {order.deviceBrand ? `${order.deviceBrand} · ` : ""}
                  {order.deviceModel} · {order.deviceType}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">
                  Estatus
                </p>
                <p className="text-lg font-black text-white mt-1">{order.status}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
                  Falla reportada
                </p>
                <p className="text-slate-200">{order.reportedIssue}</p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
                  Fecha compromiso
                </p>
                <p className="text-slate-200">{order.promisedDate}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
                  Última actualización
                </p>
                <p className="text-slate-200">{order.updatedAt || "Sin actualización disponible"}</p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
                  Resolución
                </p>
                <p className="text-slate-200">{order.resolution || "Todavía en proceso"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
                Evidencias
              </p>
              {order.progressPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {order.progressPhotos.map((photo, idx) => (
                    <img
                      key={`${photo}-${idx}`}
                      src={photo}
                      alt={`Evidencia ${idx + 1}`}
                      className="rounded-2xl border border-slate-700 object-cover w-full h-36"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">
                  Aún no hay evidencias visuales disponibles para esta orden.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
