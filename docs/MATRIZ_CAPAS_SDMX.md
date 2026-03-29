# Matriz de Capas SDMX

## 1. Propósito

Este documento define, de forma operativa, qué debe vivir en cada capa del sistema nuevo `Servicios Digitales MX`.

Su objetivo es evitar tres errores:

- meter lógica sensible en el frontend
- usar Supabase como si fuera toda la aplicación
- mezclar responsabilidades entre `Next.js`, `.NET`, `Supabase` y `Vercel`

## 2. Regla Madre

La regla técnica base del proyecto es esta:

- `Supabase` guarda
- `.NET` piensa
- `Next.js` muestra
- `Vercel` publica

Si una decisión nueva contradice esa regla, debe revisarse antes de implementarse.

## 3. Qué va en cada capa

## 3.1 Supabase

Supabase es la capa de:

- base de datos
- autenticación base
- storage
- funciones SQL
- triggers
- políticas de acceso

### Sí debe contener

- tablas del negocio
- relaciones entre entidades
- índices
- constraints
- funciones SQL transaccionales
- triggers
- almacenamiento de archivos
- usuarios base de auth si usamos Supabase Auth
- datos de tenants, shops, branches, customers, orders, inventory, purchases, expenses

### No debe contener por sí solo

- toda la lógica comercial del sistema expuesta directo al cliente
- secretos de proveedores externos
- lógica de Mercado Pago en cliente
- reglas críticas dependientes solo de JavaScript del navegador

### Cosas concretas que deben vivir en Supabase

- `tenants` / `shops`
- `branches`
- `users`
- `customers`
- `service_orders`
- `service_requests`
- `tasks`
- `suppliers`
- `products`
- `branch_inventory`
- `purchase_orders`
- `purchase_order_items`
- `expenses`
- `subscriptions`
- `subscription_payments`
- `referrals`
- `file_assets`
- evidencias, fotos y comprobantes en `Storage`

### Cuándo usar función SQL o trigger

Usar trigger o función SQL cuando:

- la operación sea transaccional
- el cambio de varias tablas deba ser atómico
- convenga asegurar consistencia aunque falle el backend después

Ejemplos:

- confirmar comisión de referidos al registrarse un pago aprobado
- actualizar balances acumulados
- mantener timestamps o históricos críticos

## 3.2 Backend API (.NET)

El backend `.NET` es la capa de:

- lógica de negocio
- validación fuerte
- orquestación entre módulos
- integración con terceros
- seguridad server-side
- contratos de API

### Sí debe contener

- endpoints HTTP
- autenticación de aplicación
- autorización
- lógica multi-tenant
- validaciones críticas
- creación de folios
- integración con Mercado Pago
- webhooks
- control de suscripciones
- reglas de referidos
- lectura y escritura coordinada en Supabase
- DTOs y contratos de respuesta

### No debe contener

- maquetación HTML del producto
- estilos
- componentes visuales
- lógica solo de presentación

### Cosas concretas que deben vivir en .NET

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/service-orders`
- `POST /api/billing/checkout-preference`
- `POST /api/webhooks/mercadopago`
- `GET /api/referrals`
- validación del acceso operativo por suscripción
- cálculo de estado comercial del shop
- generación de respuesta segura para frontend

### Qué debe ir siempre detrás y no en frontend

- Access Tokens y secretos
- service role keys
- validación de pagos
- comisiones
- desbloqueo o bloqueo de cuentas
- enforcement de permisos
- lógica que afecte dinero

## 3.3 Frontend Web (Next.js)

Next.js es la capa de:

- experiencia visual
- navegación
- paneles
- formularios
- tablas
- dashboards
- portal del cliente

### Sí debe contener

- layout general
- integrador interno visual
- dashboard
- páginas de módulos
- formularios
- estados de carga
- mensajes de error
- componentes reutilizables
- consumo del backend

### No debe contener

- lógica crítica de negocio
- secretos
- reglas que definan dinero o permisos por sí solas
- implementación completa del sistema viejo expuesta como JS público

### Qué sí hace Next correctamente

- renderiza `Operativo`, `Clientes`, `Billing`, `Referidos`
- envía formularios al backend
- muestra resultados
- cambia vistas por módulo
- reacciona a `auth/me`
- bloquea UI cuando `operationalAccess` es falso

### Qué no debe hacer Next

- decidir por sí solo si una suscripción está activa
- calcular comisiones reales
- validar referidos de forma final
- acceder directo e indiscriminadamente a toda la base

## 3.4 Vercel

Vercel es la capa de:

- hosting del frontend
- despliegue del sitio web
- entrega rápida del panel

### Sí debe contener

- despliegue de Next.js
- variables públicas del frontend
- dominio web del panel
- previews y ambientes web

### No debe contener por sí solo

- la base de datos
- la lógica comercial central
- secretos sensibles visibles al cliente

## 4. Flujo correcto de la aplicación

El flujo estándar del sistema debe ser este:

```text
Usuario
  -> Frontend Next.js
  -> Backend .NET
  -> Supabase
  -> Backend .NET
  -> Frontend Next.js
```

## 5. Cuándo el frontend puede hablar directo con Supabase

La regla por defecto es:

- el frontend habla con `.NET`

Excepciones permitidas, si luego conviene:

- login visual usando Supabase Auth
- lectura controlada de sesión
- realtime ligero
- preview de archivos en Storage

Pero incluso en esos casos:

- la lógica crítica sigue en `.NET`

## 6. Matriz exacta por responsabilidad

| Responsabilidad | Supabase | .NET | Next.js | Vercel |
| --- | --- | --- | --- | --- |
| Tablas y relaciones | Sí | No | No | No |
| Auth base | Sí | Sí | Parcial UI | No |
| Storage de archivos | Sí | No | No | No |
| Lógica multi-tenant | Parcial datos | Sí | No | No |
| Integración Mercado Pago | No | Sí | Parcial UI | No |
| Webhooks | No | Sí | No | No |
| Cálculo de comisiones | Parcial trigger | Sí | No | No |
| Formularios y paneles | No | No | Sí | No |
| Dashboard y navegación | No | No | Sí | No |
| Hosting del frontend | No | No | No | Sí |
| Secretos sensibles | No público | Sí | No | No público |

## 7. Qué NO vamos a hacer

- no vamos a copiar el sistema viejo completo al frontend como solución final
- no vamos a dejar la lógica comercial expuesta en JS cliente
- no vamos a usar Supabase como sustituto total del backend
- no vamos a poner secretos en Next
- no vamos a meter validación de dinero solo del lado cliente

## 8. Qué SÍ vamos a hacer

- frontend delgado
- backend fuerte
- Supabase como base sólida
- Vercel como hosting del panel
- migración gradual de módulos del sistema viejo
- reemplazo de cascarones por módulos reales contra backend

## 9. Módulos del proyecto y su reparto correcto

## 9.1 Operativo

- `Supabase`: órdenes, clientes, estados, promesas, archivos
- `.NET`: validación, folio, reglas operativas, persistencia
- `Next`: formulario, pasos, UI
- `Vercel`: publicación del panel

## 9.2 Clientes

- `Supabase`: tabla `customers`
- `.NET`: búsqueda, edición, historial agregado
- `Next`: listado, filtros, detalle
- `Vercel`: hosting

## 9.3 Billing

- `Supabase`: `subscriptions`, `subscription_payments`
- `.NET`: Mercado Pago, webhooks, activación, enforcement
- `Next`: pantalla de billing, CTA de pago, estado comercial
- `Vercel`: hosting

## 9.4 Referidos

- `Supabase`: `referrals`, `balance`, triggers
- `.NET`: registro, lookup, endpoints, validación comercial
- `Next`: panel de referidos, saldo, historial
- `Vercel`: hosting

## 9.5 Stock / Compras / Gastos / Finanzas

- `Supabase`: datos base, movimientos, relaciones
- `.NET`: reglas de negocio, cálculos, consolidación
- `Next`: vistas, tablas, formularios, reportes visuales
- `Vercel`: hosting

## 10. Decisión operativa desde hoy

Desde este punto, cualquier módulo nuevo debe construirse así:

1. definir tabla(s) y relaciones en Supabase si hacen falta
2. exponer lógica segura en `.NET`
3. construir la pantalla en Next.js
4. desplegar el frontend en Vercel

No se debe empezar por “copiar el frontend viejo” como solución final.

## 11. Siguiente orden recomendado

Con esta matriz ya definida, el orden de trabajo recomendado es:

1. limpiar el integrador para que sea shell real, no maqueta
2. construir `Operativo` real contra backend nuevo
3. construir `Clientes`
4. construir `Órdenes / Solicitudes`
5. después `Stock`, `Compras`, `Gastos`
6. luego `Finanzas`, `Reportes`, `Sucursales`

