"use client";

type SubscriptionGuardProps = {
  planName?: string;
  priceMxn?: number;
};

export function SubscriptionGuard({
  planName = "Plan Base",
  priceMxn = 350
}: SubscriptionGuardProps) {
  const formattedPrice = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(priceMxn);

  return (
    <div className="subscription-guard-overlay" role="alert" aria-live="assertive">
      <div className="subscription-guard-card">
        <span className="subscription-guard-badge">Acceso comercial restringido</span>
        <h2>Acceso Suspendido</h2>
        <p className="subscription-guard-lead">
          La operación interna de este local fue detenida temporalmente para proteger el orden
          comercial de la cuenta.
        </p>

        <div className="subscription-guard-reason">
          <span>Motivo</span>
          <strong>Falta de pago de la suscripción de {formattedPrice}</strong>
          <p>
            Plan actual: {planName}. En cuanto se regularice el pago, el acceso operativo volverá
            a habilitar clientes, órdenes, inventario y administración interna.
          </p>
        </div>

        <div className="subscription-guard-actions">
          <a
            className="subscription-guard-button is-primary"
            href="https://wa.me/528181234567?text=Hola%2C%20necesito%20reactivar%20mi%20suscripci%C3%B3n%20de%20Servicios%20Digitales%20MX."
            target="_blank"
            rel="noreferrer"
          >
            Contactar a Soporte
          </a>
          <a className="subscription-guard-button is-secondary" href="/billing">
            Pagar Ahora
          </a>
        </div>
      </div>
    </div>
  );
}
