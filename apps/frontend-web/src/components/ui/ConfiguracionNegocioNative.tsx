"use client";

import { useEffect, useMemo, useState } from "react";
import { useApiData } from "../../hooks/useApiData";
import { apiClient } from "../../lib/apiClient";
import { useAuth } from "./AuthGuard";
import { IconCheckCircular, IconStore, IconSync, IconWarning } from "./Icons";

type ShopBranding = {
  id: string;
  name: string;
  slug: string;
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  supportEmail?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

const DEFAULT_PRIMARY = "#2563EB";
const DEFAULT_SECONDARY = "#0F172A";

export function ConfiguracionNegocioNative() {
  const { session } = useAuth();
  const { data, loading, error, refresh } = useApiData<ShopBranding>("/api/shop/settings");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    legalName: "",
    address: "",
    phone: "",
    supportEmail: "",
    logoUrl: "",
    primaryColor: DEFAULT_PRIMARY,
    secondaryColor: DEFAULT_SECONDARY
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name || "",
      legalName: data.legalName || data.name || "",
      address: data.address || "",
      phone: data.phone || "",
      supportEmail: data.supportEmail || "",
      logoUrl: data.logoUrl || "",
      primaryColor: data.primaryColor || DEFAULT_PRIMARY,
      secondaryColor: data.secondaryColor || DEFAULT_SECONDARY
    });
  }, [data]);

  const brandName = useMemo(
    () => form.legalName.trim() || form.name.trim() || session?.shop?.name || "Tu taller",
    [form.legalName, form.name, session?.shop?.name]
  );

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const result = await apiClient.put<ShopBranding>("/api/shop/settings", {
      name: form.name,
      legalName: form.legalName,
      address: form.address,
      phone: form.phone,
      supportEmail: form.supportEmail,
      logoUrl: form.logoUrl,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor
    });

    if (result.success) {
      setMessage("Configuración guardada. El portal y los documentos ya pueden usar esta marca.");
      await refresh();
    } else {
      setMessage(result.error?.message || "No se pudo guardar la configuración.");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <section className="module-native-header">
        <div className="eyebrow">Marca Blanca</div>
        <h2>Configuración de negocio y branding</h2>
        <p>
          Define cómo se presenta tu taller ante el cliente final: nombre comercial, datos de contacto,
          logotipo y colores que aparecerán en portal, PDFs y vistas públicas.
        </p>
      </section>

      <section className="sdmx-card-premium p-6">
        <div className="sdmx-card-header">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.35rem" }}>Identidad del taller</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Esta información alimenta el white label del negocio y evita que el cliente vea branding genérico.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Cargando la configuración del negocio...</div>
        ) : error ? (
          <div className="empty-state" style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}>
            No pudimos cargar la configuración actual. Puedes intentar otra vez más abajo.
          </div>
        ) : (
          <div className="grid-cols-2" style={{ gap: "1rem" }}>
            <div className="flex-col">
              <label>Nombre comercial</label>
              <input value={form.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Ej. Celu Fix Monterrey" />
            </div>
            <div className="flex-col">
              <label>Razón social / nombre legal</label>
              <input value={form.legalName} onChange={(event) => handleChange("legalName", event.target.value)} placeholder="Ej. Tecnología y Servicio del Norte, S.A." />
            </div>
            <div className="flex-col">
              <label>Teléfono del negocio</label>
              <input value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="81 1234 5678" />
            </div>
            <div className="flex-col">
              <label>Correo de soporte</label>
              <input value={form.supportEmail} onChange={(event) => handleChange("supportEmail", event.target.value)} placeholder="soporte@tutaller.mx" />
            </div>
            <div className="flex-col" style={{ gridColumn: "1 / -1" }}>
              <label>Dirección visible</label>
              <input value={form.address} onChange={(event) => handleChange("address", event.target.value)} placeholder="Calle, número, colonia, ciudad..." />
            </div>
            <div className="flex-col" style={{ gridColumn: "1 / -1" }}>
              <label>Logo del taller (URL)</label>
              <input value={form.logoUrl} onChange={(event) => handleChange("logoUrl", event.target.value)} placeholder="https://tudominio.com/logo.png" />
            </div>
            <div className="flex-col">
              <label>Color principal</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primaryColor} onChange={(event) => handleChange("primaryColor", event.target.value)} style={{ width: 52, height: 42, padding: 4 }} />
                <input value={form.primaryColor} onChange={(event) => handleChange("primaryColor", event.target.value)} />
              </div>
            </div>
            <div className="flex-col">
              <label>Color secundario</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.secondaryColor} onChange={(event) => handleChange("secondaryColor", event.target.value)} style={{ width: 52, height: 42, padding: 4 }} />
                <input value={form.secondaryColor} onChange={(event) => handleChange("secondaryColor", event.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3" style={{ marginTop: "1.25rem", flexWrap: "wrap" }}>
          <button className="product-button" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
          <button className="product-button secondary" onClick={() => void refresh()} disabled={loading || saving}>
            <IconSync width={16} height={16} />
            Recargar
          </button>
        </div>

        {message && (
          <div className={`form-message ${message.includes("No se pudo") ? "is-error" : "is-success"}`} style={{ marginTop: "1rem" }}>
            {message}
          </div>
        )}
      </section>

      <section className="sdmx-card-premium p-6">
        <div className="sdmx-card-header">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.35rem" }}>Vista previa de marca</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Así se verá el encabezado del negocio cuando el cliente consulte su reparación o reciba documentos.
            </p>
          </div>
        </div>

        <div
          style={{
            borderRadius: "1.75rem",
            padding: "1.5rem",
            border: "1px solid rgba(255,255,255,0.08)",
            background: `linear-gradient(135deg, ${form.secondaryColor || DEFAULT_SECONDARY}, ${form.primaryColor || DEFAULT_PRIMARY})`
          }}
        >
          <div className="flex items-start justify-between gap-6" style={{ flexWrap: "wrap" }}>
            <div className="flex items-start gap-4">
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "1.25rem",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt={brandName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <IconStore width={28} height={28} />
                )}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.4rem", color: "white" }}>{brandName}</h4>
                <p style={{ margin: "0.4rem 0 0", color: "rgba(255,255,255,0.85)" }}>{form.address || "Agrega una dirección visible para tus clientes."}</p>
                <p style={{ margin: "0.35rem 0 0", color: "rgba(255,255,255,0.72)" }}>
                  {form.phone || "Sin teléfono"} · {form.supportEmail || "Sin correo"}
                </p>
              </div>
            </div>

            <div
              style={{
                minWidth: 220,
                borderRadius: "1.25rem",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "1rem 1.25rem"
              }}
            >
              <p className="muted" style={{ margin: 0, color: "rgba(255,255,255,0.65)" }}>Documento / Portal</p>
              <div className="flex items-center gap-2" style={{ marginTop: 10, color: "white", fontWeight: 700 }}>
                <IconCheckCircular width={18} height={18} />
                <span>La marca del taller manda</span>
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 10, color: "rgba(255,255,255,0.82)" }}>
                <IconWarning width={16} height={16} />
                <span>Si no subes logo, se usa un fallback limpio.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
