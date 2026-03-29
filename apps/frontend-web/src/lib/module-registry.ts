export type ModuleKey =
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

export const MODULES: Array<{ key: ModuleKey; label: string }> = [
  { key: "operativo", label: "Operativo" },
  { key: "tecnico", label: "Técnico" },
  { key: "solicitudes", label: "Solicitudes" },
  { key: "archivo", label: "Archivo" },
  { key: "clientes", label: "Clientes" },
  { key: "tareas", label: "Tareas" },
  { key: "stock", label: "Stock" },
  { key: "proveedores", label: "Proveedores" },
  { key: "compras", label: "Compras" },
  { key: "gastos", label: "Gastos" },
  { key: "finanzas", label: "Finanzas" },
  { key: "reportes", label: "Reportes" },
  { key: "sucursales", label: "Sucursales" }
];

export function isModuleKey(value: string): value is ModuleKey {
  return MODULES.some((module) => module.key === value);
}
