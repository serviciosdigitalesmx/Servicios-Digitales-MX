export type ModuleKey =
  | "negocio"
  | "operativo"
  | "tecnico"
  | "solicitudes"
  | "archivo"
  | "clientes"
  | "tareas"
  | "stock"
  | "proveedores"
  | "compras"
  | "gastos"
  | "finanzas"
  | "reportes"
  | "sucursales";

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  table: string;
  summary: string;
};

export const MODULES: Array<ModuleDefinition> = [
  {
    key: "negocio",
    label: "Negocio",
    table: "tenants",
    summary: "Branding, datos fiscales y presencia de marca"
  },
  {
    key: "operativo",
    label: "Operativo",
    table: "service_orders",
    summary: "Recepción, alta y seguimiento de órdenes"
  },
  {
    key: "tecnico",
    label: "Técnico",
    table: "service_order_checklists",
    summary: "Diagnóstico, checklist y avance técnico"
  },
  {
    key: "solicitudes",
    label: "Solicitudes",
    table: "service_requests",
    summary: "Cotizaciones y capturas de entrada"
  },
  {
    key: "archivo",
    label: "Archivo",
    table: "service_orders",
    summary: "Historial operativo y trazabilidad"
  },
  {
    key: "clientes",
    label: "Clientes",
    table: "customers",
    summary: "Directorio de clientes y seguimiento"
  },
  {
    key: "tareas",
    label: "Tareas",
    table: "tasks",
    summary: "Pendientes internos y asignaciones"
  },
  {
    key: "stock",
    label: "Stock",
    table: "branch_inventory",
    summary: "Existencias, refacciones y alertas"
  },
  {
    key: "proveedores",
    label: "Proveedores",
    table: "suppliers",
    summary: "Catálogo de proveedores y contacto"
  },
  {
    key: "compras",
    label: "Compras",
    table: "purchase_orders",
    summary: "Ordenes de compra y recepción"
  },
  {
    key: "gastos",
    label: "Gastos",
    table: "expenses",
    summary: "Egresos y control de caja"
  },
  {
    key: "finanzas",
    label: "Finanzas",
    table: "expenses",
    summary: "Resumen económico y de flujo"
  },
  {
    key: "reportes",
    label: "Reportes",
    table: "customer_payments",
    summary: "Visión ejecutiva y rendimiento"
  },
  {
    key: "sucursales",
    label: "Sucursales",
    table: "branches",
    summary: "Control multi-sucursal y operación"
  }
];

export function isModuleKey(value: string): value is ModuleKey {
  return MODULES.some((module) => module.key === value);
}
