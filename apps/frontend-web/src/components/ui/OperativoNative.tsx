"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { fetchWithAuth } from "../../lib/apiClient";
import { useAuth } from "./AuthGuard";

type ReceptionStep = 1 | 2 | 3;

type Customer = { id: string; fullName: string; phone?: string; email?: string; tag: string; };

type Order = {
  id: string; folio: string; status: string; deviceType: string; deviceModel?: string;
  priority?: string; customerName?: string; assignedTechnician?: string; estimatedCost?: number;
  promisedDate?: string; createdAt: string;
};

type OrderAsset = {
  id: string;
  serviceOrderId?: string;
  fileType: string;
  bucketName: string;
  storagePath: string;
  publicUrl?: string;
  createdAt: string;
};

type CustomerApiRow = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  tag?: string | null;
};

type ServiceOrderApiRow = {
  id: string;
  folio: string;
  status: string;
  deviceType: string;
  deviceModel?: string | null;
  priority?: string | null;
  estimatedCost?: number | null;
  promisedDate?: string | null;
  createdAt: string;
};

import { supabase } from "../../lib/supabase";

function normalizeRole(role?: string) {
  const normalized = (role ?? "").trim().toLowerCase();
  return normalized === "admin" ? "owner" : normalized;
}

function formatDate(value?: string) {
  if (!value) return "Sin promesa";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatMoney(value?: number) {
  if (value === undefined || value === null) return "$0.00";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value);
}

const SERVICE_ORDER_STATUS_ALIASES: Record<string, string> = { received: "recibido", diagnosing: "diagnostico", repairing: "reparacion", completed: "entregado" };
const SERVICE_ORDER_STATUS_LABELS: Record<string, string> = { recibido: "Recibido", diagnostico: "En diagnóstico", reparacion: "En reparación", listo: "Listo", entregado: "Entregado", cancelado: "Cancelado", archivado: "Archivado" };

const SERVICE_ORDER_STATUS_OPTIONS = [
  { value: "ALL", label: "Todos los estados" }, { value: "recibido", label: "Recibido" },
  { value: "diagnostico", label: "En diagnóstico" }, { value: "reparacion", label: "En reparación" },
  { value: "listo", label: "Listo" }, { value: "entregado", label: "Entregado" }
];

function normalizeServiceOrderStatus(value?: string) { return SERVICE_ORDER_STATUS_ALIASES[(value ?? "").trim().toLowerCase()] ?? (value ?? "").trim().toLowerCase(); }
function getServiceOrderStatusLabel(value?: string) { return SERVICE_ORDER_STATUS_LABELS[normalizeServiceOrderStatus(value)] ?? (value ? value : "Sin estado"); }
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error || isPostgrestError(error) ? error.message : fallback;
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === "object" && error !== null && "message" in error;
}

function mapCustomerApiRow(customer: CustomerApiRow): Customer {
  return {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone ?? undefined,
    email: customer.email ?? undefined,
    tag: customer.tag || "nuevo"
  };
}

function mapServiceOrderApiRow(order: ServiceOrderApiRow): Order {
  return {
    id: order.id,
    folio: order.folio,
    status: order.status,
    deviceType: order.deviceType,
    deviceModel: order.deviceModel ?? undefined,
    priority: order.priority ?? undefined,
    estimatedCost: Number(order.estimatedCost || 0),
    promisedDate: order.promisedDate ?? undefined,
    createdAt: order.createdAt
  };
}

export function OperativoNative() {
  const { session } = useAuth();
  const normalizedRole = normalizeRole(session?.user?.role);
  const canUploadOperationalAssets = ["owner", "manager", "receptionist"].includes(normalizedRole);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStateMessage, setApiStateMessage] = useState("");
  const [apiStateError, setApiStateError] = useState("");
  const [formErrorOrder, setFormErrorOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [receptionStep, setReceptionStep] = useState<ReceptionStep>(1);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [assets, setAssets] = useState<OrderAsset[]>([]);
  const [assetType, setAssetType] = useState("reception_photo");
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetFeedback, setAssetFeedback] = useState("");

  const [orderForm, setOrderForm] = useState({
    customerId: "", deviceType: "", deviceBrand: "", deviceModel: "", serialNumber: "",
    reportedIssue: "", priority: "normal", promisedDate: "", estimatedCost: "0"
  });

  async function loadData() {
    if (!session?.shop.id) return;
    setLoading(true); setApiStateError(""); setApiStateMessage("");
    try {
      if (!session.subscription.operationalAccess) { setCustomers([]); setOrders([]); return; }

      const [customersRes, ordersRes] = await Promise.all([
        fetchWithAuth("/api/customers?page=1&pageSize=100"),
        fetchWithAuth("/api/service-orders?page=1&pageSize=100")
      ]);

      const customersPayload = await customersRes.json();
      const ordersPayload = await ordersRes.json();

      if (!customersRes.ok) {
        throw new Error(customersPayload?.error?.message || "No se pudieron cargar los clientes");
      }
      if (!ordersRes.ok) {
        throw new Error(ordersPayload?.error?.message || "No se pudieron cargar las órdenes");
      }

      const customersData = Array.isArray(customersPayload?.data) ? customersPayload.data : [];
      const ordersData = Array.isArray(ordersPayload?.data) ? ordersPayload.data : [];

      setCustomers(customersData.map(mapCustomerApiRow));
      setOrders(ordersData.map(mapServiceOrderApiRow));
    } catch (error: unknown) {
       setApiStateError(getErrorMessage(error, "Error al conectar con Supabase."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (session) void loadData(); 
  }, [session]);

  useEffect(() => {
    if (!session?.shop.id || !session.subscription.operationalAccess) return;

    const channel = supabase
      .channel(`operativo-live-${session.shop.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_orders",
          filter: `tenant_id=eq.${session.shop.id}`
        },
        () => {
          void loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
          filter: `tenant_id=eq.${session.shop.id}`
        },
        () => {
          void loadData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.shop.id, session?.subscription.operationalAccess]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === orderForm.customerId),
    [customers, orderForm.customerId]
  );

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormErrorOrder(""); setApiStateError(""); setApiStateMessage("");

    if (!session?.user.branchId) return setFormErrorOrder("⚠️ Tu usuario no tiene asignada una sucursal.");
    if (!orderForm.customerId) return setFormErrorOrder("⚠️ Selecciona a qué cliente se le asignará el equipo.");
    if (!orderForm.deviceType.trim()) return setFormErrorOrder("⚠️ Indica el tipo de equipo a recibir.");
    if (!orderForm.reportedIssue.trim()) return setFormErrorOrder("⚠️ Describe cuál es el desgaste físico o falla.");

    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/service-orders", {
        method: "POST",
        body: JSON.stringify({
          branchId: session.user.branchId,
          customerId: orderForm.customerId,
          serviceRequestId: null,
          deviceType: orderForm.deviceType,
          deviceBrand: orderForm.deviceBrand || null,
          deviceModel: orderForm.deviceModel || null,
          serialNumber: orderForm.serialNumber || null,
          reportedIssue: orderForm.reportedIssue,
          priority: orderForm.priority || null,
          promisedDate: orderForm.promisedDate || null,
          estimatedCost: Number(orderForm.estimatedCost || 0)
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo crear la orden");
      }

      setOrderForm({ customerId: "", deviceType: "", deviceBrand: "", deviceModel: "", serialNumber: "", reportedIssue: "", priority: "normal", promisedDate: "", estimatedCost: "0" });
      setReceptionStep(1);
      await loadData();
      setApiStateMessage(`✅ Orden de servicio creada exitosamente${payload?.data?.folio ? ` (${payload.data.folio})` : ""}.`);
    } catch (error: unknown) {
      setApiStateError(getErrorMessage(error, "Error al procesar la orden."));
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchQuery || order.folio.toLowerCase().includes(searchQuery.toLowerCase()) || order.deviceType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || normalizeServiceOrderStatus(order.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0],
    [filteredOrders, selectedOrderId]
  );

  useEffect(() => {
    if (!selectedOrderId && filteredOrders.length > 0) {
      setSelectedOrderId(filteredOrders[0].id);
    }
    if (filteredOrders.length === 0) {
      setSelectedOrderId("");
    }
  }, [filteredOrders, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrder?.id) {
      setAssets([]);
      setAssetFeedback("");
      return;
    }

    let cancelled = false;

    async function loadAssets() {
      try {
        const response = await fetchWithAuth(`/api/service-orders/${selectedOrder.id}/assets`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar las evidencias");
        }

        const payload = await response.json();
        if (!cancelled) {
          setAssets(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setAssets([]);
          setAssetFeedback(getErrorMessage(error, "No se pudieron leer las evidencias"));
        }
      }
    }

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [selectedOrder?.id]);

  function validateStep(step: ReceptionStep) {
    if (step === 1) {
      if (!orderForm.customerId) {
        setFormErrorOrder("⚠️ Selecciona el cliente antes de continuar.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!orderForm.deviceType.trim()) {
        setFormErrorOrder("⚠️ Indica el tipo de equipo.");
        return false;
      }
      if (!orderForm.reportedIssue.trim()) {
        setFormErrorOrder("⚠️ Describe la falla reportada.");
        return false;
      }
      return true;
    }

    return true;
  }

  function goToStep(step: ReceptionStep) {
    setFormErrorOrder("");
    setReceptionStep(step);
  }

  function handleStepAdvance() {
    if (!validateStep(receptionStep)) return;
    setFormErrorOrder("");
    setReceptionStep((current) => (current === 3 ? current : ((current + 1) as ReceptionStep)));
  }

  const receptionStepCopy = {
    1: {
      eyebrow: "Paso 1",
      title: "Cliente y compromiso comercial",
      description: "Selecciona al cliente y deja listo el marco operativo de la recepción."
    },
    2: {
      eyebrow: "Paso 2",
      title: "Equipo y falla reportada",
      description: "Captura el dispositivo, la serie y el problema con más contexto."
    },
    3: {
      eyebrow: "Paso 3",
      title: "Confirmación de recepción",
      description: "Revisa el resumen final antes de generar el folio de servicio."
    }
  } as const;

  async function handleAssetUpload(file: File | null) {
    if (!file || !selectedOrder?.id) return;
    if (!canUploadOperationalAssets) {
      setAssetFeedback("Tu rol no puede subir evidencias de recepción desde este módulo.");
      return;
    }

    setAssetUploading(true);
    setAssetFeedback("");
    try {
      const base64 = await fileToBase64(file);
      const response = await fetchWithAuth(`/api/service-orders/${selectedOrder.id}/assets`, {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          base64Data: base64,
          fileType: assetType
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "No se pudo subir la evidencia");
      }

      setAssetFeedback("Evidencia de recepción subida correctamente.");
      const refreshed = await fetchWithAuth(`/api/service-orders/${selectedOrder.id}/assets`);
      const refreshedPayload = await refreshed.json();
      setAssets(Array.isArray(refreshedPayload?.data) ? refreshedPayload.data : []);
    } catch (error) {
      setAssetFeedback(getErrorMessage(error, "No se pudo subir la evidencia"));
    } finally {
      setAssetUploading(false);
    }
  }

  return (
    <section className="operativo-shell animate-fadeIn space-y-8">
      <div className="operativo-header flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex-col">
          <span className="font-label uppercase tracking-[0.3em] text-blue-500 font-black text-[10px] block mb-2">Terminal de Recepción</span>
          <h1 className="font-tech text-white text-4xl uppercase tracking-tighter mb-2">Ingreso de Equipos</h1>
          <p className="font-label text-slate-500 max-w-xl text-lg">Centraliza la entrada de dispositivos, asigna prioridades y garantiza la trazabilidad desde el minuto uno.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <input 
             type="text" 
             className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 font-label text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600 min-w-[280px]" 
             placeholder="🔍 Buscar Folio o Equipo..." 
             value={searchQuery} 
             onChange={(e) => setSearchQuery(e.target.value)} 
           />
           <select 
             className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 font-label text-blue-400 font-bold text-xs uppercase tracking-widest focus:border-blue-500/50 outline-none cursor-pointer"
             value={statusFilter} 
             onChange={(e) => setStatusFilter(e.target.value)}
           >
             {SERVICE_ORDER_STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>))}
           </select>
        </div>
      </div>

      {apiStateMessage && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-label font-bold text-sm rounded-xl animate-fadeIn">{apiStateMessage}</div>}
      {apiStateError && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-label font-bold text-sm rounded-xl animate-fadeIn">{apiStateError}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <form className="xl:col-span-4 sdmx-glass p-8 rounded-[2.5rem] border-white/5 flex flex-col" onSubmit={handleCreateOrder}>
          <div className="border-b border-white/5 pb-6 mb-8">
             <div className="flex justify-between items-start gap-4">
               <div>
                 <span className="font-tech text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">{receptionStepCopy[receptionStep].eyebrow}</span>
                 <h3 className="font-tech text-white text-lg uppercase tracking-wider mt-1">{receptionStepCopy[receptionStep].title}</h3>
                 <p className="font-label text-slate-500 text-xs mt-1 leading-relaxed">{receptionStepCopy[receptionStep].description}</p>
               </div>
               <div className="flex gap-2">
                 {[1, 2, 3].map((step) => {
                   const active = receptionStep === step;
                   const unlocked = step <= receptionStep;
                   return (
                     <button
                       key={step}
                       type="button"
                       onClick={() => unlocked && goToStep(step as ReceptionStep)}
                       className={`w-9 h-9 rounded-full font-tech text-xs font-black transition-all border ${
                         active 
                         ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20' 
                         : unlocked 
                           ? 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700' 
                           : 'bg-slate-900 text-slate-700 border-white/5'
                       }`}
                     >
                       {step}
                     </button>
                   );
                 })}
               </div>
             </div>
          </div>

          <div className="flex-1 space-y-6">
            {formErrorOrder && <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-label font-bold text-xs rounded-xl">{formErrorOrder}</div>}

            {receptionStep === 1 ? (
              <>
                <div className="space-y-2">
                   <label className="font-label text-[10px] text-slate-500 uppercase tracking-widest font-black ml-1">Cliente Vinculado</label>
                   <select 
                     className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-label font-bold focus:border-blue-500/50 outline-none transition-all"
                     value={orderForm.customerId} 
                     onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                   >
                     <option value="" className="bg-slate-900">-- Directorio de Clientes --</option>
                     {customers.map((c) => (<option key={c.id} value={c.id} className="bg-slate-900">{c.fullName}</option>))}
                   </select>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-label text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">Contacto</span>
                      <strong className="block text-white font-tech text-xs mt-1 truncate">
                        {selectedCustomer?.fullName ?? "Definir..."}
                      </strong>
                    </div>
                    <div>
                      <span className="font-label text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">Segmento</span>
                      <div className="mt-1">
                        <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase px-2 py-1 rounded-md border border-blue-500/20 tracking-tighter">
                          {selectedCustomer?.tag?.toUpperCase() ?? "NUEVO"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="font-label text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">Teléfono / Email</span>
                    <p className="text-slate-400 font-label font-bold text-xs mt-1 truncate">
                      {selectedCustomer ? `${selectedCustomer.phone || 'S/T'} · ${selectedCustomer.email || 'S/E'}` : "Información pendiente"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <label className="font-label text-[9px] text-slate-500 uppercase tracking-widest font-black ml-1">Prioridad</label>
                      <select 
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-slate-300 font-label font-bold text-xs focus:border-blue-500/50 outline-none transition-all"
                        value={orderForm.priority} 
                        onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                      >
                        <option value="normal" className="bg-slate-900">Estándar</option>
                        <option value="alta" className="bg-slate-900">Alta Demanda</option>
                        <option value="urgente" className="bg-slate-900">Urgencia Crítca</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="font-label text-[9px] text-slate-500 uppercase tracking-widest font-black ml-1">Costo Estimado</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-tech text-xs">$</span>
                          <input 
                            type="number" 
                            className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-tech text-sm focus:border-blue-500/50 outline-none transition-all"
                            min="0" step="0.01" 
                            value={orderForm.estimatedCost} 
                            onChange={(e) => setOrderForm({ ...orderForm, estimatedCost: e.target.value })} 
                          />
                       </div>
                    </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[9px] text-slate-500 uppercase tracking-widest font-black ml-1">Promesa de Entrega</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-slate-300 font-tech text-xs focus:border-blue-500/50 outline-none transition-all"
                    value={orderForm.promisedDate} 
                    onChange={(e) => setOrderForm({ ...orderForm, promisedDate: e.target.value })} 
                  />
                </div>
              </>
            ) : null}

            {receptionStep === 2 ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label text-[9px] text-slate-500 uppercase tracking-widest font-black ml-1">Dispositivo *</label>
                    <input 
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white font-label font-bold text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                      required value={orderForm.deviceType} 
                      onChange={(e) => setOrderForm({ ...orderForm, deviceType: e.target.value })} 
                      placeholder="Laptop, Consola..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[9px] text-slate-500 uppercase tracking-widest font-black ml-1">Marca</label>
                    <input 
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white font-label font-bold text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                      value={orderForm.deviceBrand} 
                      onChange={(e) => setOrderForm({ ...orderForm, deviceBrand: e.target.value })} 
                      placeholder="Ej. Apple, Dell" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label text-[9px] text-slate-500 uppercase tracking-widest font-black ml-1">Modelo</label>
                    <input 
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white font-label font-bold text-sm focus:border-blue-500/50 outline-none transition-all"
                      value={orderForm.deviceModel} 
                      onChange={(e) => setOrderForm({ ...orderForm, deviceModel: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[9px] text-slate-500 uppercase tracking-widest font-black ml-1">Serie / IMEI</label>
                    <input 
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white font-tech text-[10px] focus:border-blue-500/50 outline-none transition-all"
                      value={orderForm.serialNumber} 
                      onChange={(e) => setOrderForm({ ...orderForm, serialNumber: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-500/10">
                  <span className="font-tech text-white text-[9px] font-black uppercase tracking-[0.2em] opacity-70 block mb-1">Recepción Guiada</span>
                  <p className="text-white text-[11px] font-label font-bold leading-relaxed opacity-90">
                    Captura los detalles físicos visibles para evitar confusiones al momento de la entrega final.
                  </p>
                </div>

                <div className="space-y-2">
                   <label className="font-label text-[9px] text-slate-500 uppercase tracking-widest font-black ml-1">Falla Reportada *</label>
                   <textarea 
                     className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-label font-bold text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700 min-h-[140px] resize-none"
                     required 
                     value={orderForm.reportedIssue} 
                     onChange={(e) => setOrderForm({ ...orderForm, reportedIssue: e.target.value })} 
                     placeholder="Describe el estado físico y el problema reportado..."
                   />
                </div>
              </div>
            ) : null}

            {receptionStep === 3 ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                  <span className="font-label text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold">Cliente</span>
                  <div className="font-tech text-white text-sm mt-1">{selectedCustomer?.fullName ?? "Sin cliente"}</div>
                  <div className="font-label text-slate-500 text-[10px] mt-1 font-bold">CONTACTO: {selectedCustomer?.phone || "S/T"}</div>
                </div>

                <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                  <span className="font-label text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold">Equipo Técnico</span>
                  <div className="font-tech text-white text-sm mt-1">
                    {[orderForm.deviceType, orderForm.deviceBrand, orderForm.deviceModel].filter(Boolean).join(" ")}
                  </div>
                  <div className="font-label text-blue-400 text-[10px] mt-1 font-bold uppercase tracking-widest italic">SERIE: {orderForm.serialNumber || "NO CAPTURADO"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                    <span className="font-label text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold">Entrega</span>
                    <div className="font-tech text-white text-xs mt-1">{formatDate(orderForm.promisedDate)}</div>
                  </div>
                  <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20">
                    <span className="font-label text-[9px] text-blue-500 uppercase tracking-[0.2em] font-bold">Cotización</span>
                    <div className="font-tech text-blue-400 text-sm mt-1">{formatMoney(Number(orderForm.estimatedCost || 0))}</div>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5">
                  <span className="font-label text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold">Diagnóstico de Entrada</span>
                  <p className="font-label text-slate-300 text-sm mt-2 leading-relaxed italic">
                    "{orderForm.reportedIssue || "Sin descripción."}"
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
            {receptionStep > 1 && (
              <button 
                type="button" 
                onClick={() => goToStep((receptionStep - 1) as ReceptionStep)} 
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-tech text-[10px] uppercase tracking-[0.2em] transition-all"
              >
                Anterior
              </button>
            )}

            {receptionStep < 3 ? (
              <button 
                type="button" 
                disabled={loading || customers.length === 0} 
                onClick={handleStepAdvance} 
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-tech text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all font-black"
              >
                Siguiente
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={loading || customers.length === 0} 
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-tech text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all font-black"
              >
                Generar Orden
              </button>
            )}
          </div>
        </form>

        <div className="xl:col-span-8 flex flex-col gap-8">
          <div className="sdmx-glass p-8 rounded-[2.5rem] border-white/5 flex flex-col h-[520px]">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="font-tech text-white text-xl uppercase tracking-wider">Historial Operativo</h3>
                  <p className="font-label text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Registros en Tiempo Real</p>
               </div>
               <span className="bg-slate-800 text-slate-400 px-4 py-2 rounded-full font-label text-[10px] font-bold uppercase tracking-widest border border-white/5">
                 {filteredOrders.length} Resultados
               </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 sdmx-scrollbar">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40 py-10">
                  <div className="text-4xl mb-4">📋</div>
                  <strong className="font-tech text-white text-sm uppercase tracking-widest">Sin actividad reciente</strong>
                  <p className="font-label text-slate-500 text-xs mt-2 uppercase font-bold tracking-widest">Inicia una recepción para ver el flujo aquí.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const created = new Date(order.createdAt);
                  const now = new Date();
                  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
                  const delayed = diffHours > 48 && !['entregado', 'listo'].includes(normalizeServiceOrderStatus(order.status));

                  return (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`group flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                        selectedOrder?.id === order.id 
                        ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5' 
                        : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-tech ${
                          delayed ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-400'
                        }`}>
                          <span className="text-[10px] opacity-60 leading-none mb-1">PRO</span>
                          <span className="text-sm font-black tracking-tighter">SD</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <strong className="font-tech text-white text-sm uppercase tracking-wider">{order.folio}</strong>
                             {delayed && <span className="bg-red-500/10 text-red-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-widest animate-pulse">Retraso</span>}
                          </div>
                          <p className="font-label text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
                            {order.deviceType} · {order.deviceModel ?? "Genérico"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                         <div className="text-right hidden sm:block">
                            <span className="font-label text-slate-500 text-[9px] uppercase tracking-[0.2em] block">Status</span>
                            <span className={`font-label font-black text-[10px] uppercase tracking-widest ${
                              order.status === 'entregado' ? 'text-emerald-400' : order.status === 'reparacion' ? 'text-blue-400' : 'text-amber-400'
                            }`}>
                              {getServiceOrderStatusLabel(order.status)}
                            </span>
                         </div>
                         <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-600 group-hover:text-white transition-all">
                            <div className="w-1.5 h-1.5 bg-current rounded-full" />
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="sdmx-glass p-8 rounded-[2.5rem] border-white/5">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                   <div className="w-4 h-4 border-2 border-current rounded-sm shadow-glow" />
                </div>
                <div>
                   <h3 className="font-tech text-white text-base uppercase tracking-wider">Módulo de Evidencia Táctica</h3>
                   <p className="font-label text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Sincronización con Expediente de Cliente</p>
                </div>
             </div>

             {!selectedOrder ? (
              <div className="py-12 bg-slate-900/40 rounded-3xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center opacity-40">
                 <p className="font-tech text-[10px] text-white uppercase tracking-widest">Selecciona una orden del historial</p>
              </div>
             ) : (
               <div className="space-y-6">
                 <div className="flex flex-col sm:flex-row gap-4">
                   <select 
                     className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 font-label text-white text-xs uppercase tracking-widest focus:outline-none"
                     value={assetType}
                     onChange={(event) => setAssetType(event.target.value)}
                     disabled={!canUploadOperationalAssets || assetUploading}
                   >
                     <option value="reception_photo" className="bg-slate-900">Foto de Recepción</option>
                     <option value="evidence" className="bg-slate-900">Evidencia Técnica</option>
                     <option value="delivery_photo" className="bg-slate-900">Foto de Entrega</option>
                   </select>

                   <label className="flex-1 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-tech text-[10px] uppercase tracking-[0.2em] font-black py-4 rounded-xl cursor-pointer transition-all shadow-xl shadow-blue-500/10">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={assetUploading || !canUploadOperationalAssets}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          void handleAssetUpload(file);
                          event.currentTarget.value = "";
                        }}
                      />
                      {assetUploading ? "Subiendo..." : "Adjuntar Evidencia"}
                   </label>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {assets.length === 0 ? (
                     <div className="col-span-full py-10 text-center opacity-30 font-label text-xs uppercase tracking-widest font-bold">Sin activos registrados</div>
                   ) : (
                     assets.map((asset) => (
                       <a 
                         key={asset.id} 
                         href={asset.publicUrl} 
                         target="_blank" 
                         className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group"
                       >
                         <div className="flex justify-between items-start mb-2">
                            <span className="font-tech text-blue-400 text-[8px] uppercase tracking-widest">{asset.fileType}</span>
                            <div className="w-1 h-1 bg-blue-500 rounded-full" />
                         </div>
                         <p className="font-label text-slate-400 text-[9px] font-bold uppercase truncate">{new Date(asset.createdAt).toLocaleDateString()}</p>
                       </a>
                     ))
                   )}
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </section>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el archivo"));
        return;
      }

      const [, base64 = ""] = result.split(",", 2);
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("No se pudo procesar el archivo"));
    reader.readAsDataURL(file);
  });
}
