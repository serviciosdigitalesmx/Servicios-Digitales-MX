# Catálogo Detallado de Módulos y Funcionalidad 🚀

Este documento detalla la arquitectura funcional y de interfaz del sistema **SDMX (Servicios Digitales MX)**, destacando las capacidades específicas que garantizan una operación premium y segura.

---

## 1. Núcleo Operativo (Core)

### 📦 Gestión de Órdenes de Servicio
*   **Emisión de Tickets**: Generación de folios automáticos (ej. `ORD-000123`).
*   **🚦 Semáforo de Alerta (Vigilancia 48h)**: El sistema monitorea el tiempo de inactividad. Si una orden supera las **48 horas sin avance**, se marca automáticamente con un borde rojo y la etiqueta `⚠️ SIN AVANCE (+48H)` en los paneles operativo y técnico para priorización inmediata.
*   **Priorización Visual**: Codificación por colores para niveles de urgencia (Estándar, Alta Demanda, Crítica).
*   **Control de Sucursal**: Segmentación automática por `branch_id` para operaciones multi-local.

### 🧑‍🔧 Laboratorio Técnico
*   **Journaling Dual**:
    *   **Bitácora Interna**: Notas privadas para el equipo técnico sobre reparaciones complejas.
    *   **Resolución del Caso**: Campo específico destinado al cliente, visible en el portal y reportes finales (ej. "Se reemplazó módulo wifi y se aplicó mantenimiento térmico").
*   **Tareas del Taller**: Checklist interno para pendientes no vinculados a equipos (ej. mantenimiento de herramientas).

### 📁 Archivo Histórico
*   **Memoria Operativa**: Historial de servicios entregados con costos finales y técnicos responsables.

---

## 2. Experiencia del Cliente (UX)

### 🌐 Portal Público de Rastreo
*   **Acceso por Folio**: El cliente consulta su estatus sin logins complejos, solo con su número de orden.
*   **Live Timeline**: Visualización de la "Bitácora de Avance" que el técnico redacta en tiempo real.
*   **🖼️ Evidencia Fotográfica**: Galería de fotos del proceso de reparación ("Antes y Después") para generar confianza total.
*   **WhatsApp Bridge**: Botón de contacto directo pre-configurado con el folio del cliente para atención inmediata.

### 📩 Solicitudes y Cotizaciones
*   **Cazador de Leads**: Formulario público para captar requerimientos antes de que el equipo llegue al mostrador.
*   **Hardening de Seguridad**: Registro automático de la **IP de origen** de cada solicitud para auditoría y prevención de spam.
*   **Panel de Conversión**: Dashboard comercial con "Ingreso Potencial" basado en cotizaciones pendientes de autorización.

---

## 3. Administración y Finanzas

### 🛠️ Inventario e Inteligencia de Stock
*   **Stock Inteligente**: Alertas de reabastecimiento cuando las refacciones llegan a su límite mínimo.
*   **SKU Tracking**: Seguimiento exacto desde la compra al proveedor hasta la instalación en el equipo del cliente.

### 📊 Finanzas y Rentabilidad
*   **Dashboard de Salud**: Balance integrado entre ingresos por servicios y egresos operativos (renta, sueldos, refacciones).
*   **Multi-tenant JWT**: Aislamiento bancario de datos; cada tienda tiene su propia "bóveda" cifrada de información financiera.

---

## 4. Infraestructura SaaS

### 🏢 Gestión Pro & Elite
*   **Suscripciones**: Integración nativa con Mercado Pago para planes Esencial, Pro y Elite.
*   **Sistema de Referidos**: Programa de comisiones automatizado para el crecimiento de la red.
