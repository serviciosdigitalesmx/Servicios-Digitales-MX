"use client";

const MODULE_CHIPS = [
  "Panel Técnico",
  "Folios",
  "Estatus",
  "Fechas de Entrega",
  "Finanzas",
  "Solicitudes",
  "Gastos",
  "Órdenes",
  "Mensajería",
  "Estadísticas",
  "Stock Bajo",
  "Garantías",
  "Alertas"
];

const FEATURES = [
  "Recepción profesional y Panel Técnico",
  "Portal del cliente por folio automático",
  "Control de refacciones, stock y compras",
  "Finanzas completas con Mercado Pago",
  "Sistema de referidos para todos los planes"
];

const PLANS = [
  {
    name: "Esencial",
    code: "esencial-350",
    price: "$350",
    meta: "1 Sucursal · 1 Usuario",
    button: "Comenzar Ahora",
    tone: "light",
    features: [
      "Recepción / Operativo",
      "Panel de Técnico",
      "Solicitudes y Cotizaciones",
      "Archivo Histórico",
      "Gestión de Clientes",
      "Portal por Folio",
      "Sistema de Referidos"
    ]
  },
  {
    name: "Profesional",
    code: "profesional-650",
    price: "$650",
    meta: "1 Sucursal · Usuarios Ilimitados",
    button: "Lo quiero ya",
    tone: "featured",
    badge: "El más popular",
    features: [
      "Todo lo del Esencial",
      "Stock e Inventario",
      "Compras y Proveedores",
      "Gastos y Finanzas",
      "Reportes Operativos",
      "Sistema de Referidos"
    ]
  },
  {
    name: "Elite",
    code: "elite-1200",
    price: "$1,200",
    meta: "Multi-sucursal · Usuarios Ilimitados",
    button: "Hablar con Ventas",
    tone: "light",
    features: [
      "Todo lo del Profesional",
      "Multi-sucursal Ilimitado",
      "Branding (Tu Logo)",
      "Dashboard Ejecutivo",
      "Soporte VIP",
      "Sistema de Referidos"
    ]
  }
];

const TESTIMONIALS = [
  {
    name: "Anahí G.",
    role: "Taller de Celulares",
    text: "Gracias a Servicios Digitales MX, mi taller ha ganado mucha eficiencia. Llevar el control de inventario es sencillo."
  },
  {
    name: "Carlos M.",
    role: "Servicio Automotriz",
    text: "SDMX transformó la manera en que gestiono mi taller. Ahora todo está centralizado y he reducido errores."
  },
  {
    name: "María M.",
    role: "Centro Técnico",
    text: "Desde que implementé Servicios Digitales MX, la organización ha mejorado notablemente. Puedo seguir cada reparación."
  }
];

export function MarketingLanding() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <div className="landing-nav-card">
          <a className="landing-brand" href="#inicio">
            <img src="/logo-srfix.webp" alt="Servicios Digitales MX" className="landing-brand-logo" />
            <span>
              Servicios Digitales <em>MX</em>
            </span>
          </a>

          <div className="landing-nav-links">
            <a href="#inicio">Inicio</a>
            <a href="#caracteristicas">Características</a>
            <a href="#planes">Planes</a>
            <a href="#contacto">Contacto</a>
            <a className="landing-nav-cta" href="/interno">
              Acceso Clientes
            </a>
          </div>
        </div>
      </nav>

      <section id="inicio" className="landing-hero">
        <div className="landing-container landing-hero-inner">
          <h1>
            Te presentamos el mejor software
            <br />
            para administrar tu <span>taller de reparación</span>
          </h1>
          <p>Toma el control de tu negocio con una sola aplicación.</p>

          <div className="landing-pill-row">
            <button>Recepción</button>
            <button>Inventario</button>
            <button>Finanzas</button>
            <button>Clientes</button>
          </div>

          <div className="landing-chip-grid">
            {MODULE_CHIPS.map((chip) => (
              <span key={chip} className="landing-chip">
                {chip}
              </span>
            ))}
          </div>

          <div className="landing-cta-card">
            <div className="landing-cta-actions">
              <a className="landing-primary-button" href="#planes">
                Comenzar ahora
              </a>
              <a className="landing-secondary-button" href="https://wa.me/528181234567" target="_blank" rel="noreferrer">
                Consultar por WhatsApp
              </a>
            </div>
            <p>Suscríbete mensualmente de forma segura con Mercado Pago.</p>
          </div>

          <div className="landing-dashboard-preview">
            <div className="landing-watermark">TODO EL CONTROL</div>
            <div className="landing-preview-main">
              <div className="landing-preview-card">
                <div className="landing-preview-header">
                  <img src="/logo-srfix.webp" alt="Servicios Digitales MX" />
                  <div>
                    <strong>Servicios Digitales MX</strong>
                    <span>Operación, clientes, inventario y finanzas</span>
                  </div>
                </div>

                <div className="landing-preview-grid">
                  <div className="landing-preview-panel">
                    <span>Nueva orden</span>
                    <strong>Recepción rápida</strong>
                    <p>Cliente, equipo, promesa de entrega y costo estimado.</p>
                  </div>
                  <div className="landing-preview-panel">
                    <span>Finanzas</span>
                    <strong>$1055 MXN</strong>
                    <p>Utilidad proyectada del periodo actual.</p>
                  </div>
                  <div className="landing-preview-panel">
                    <span>Stock</span>
                    <strong>12 alertas</strong>
                    <p>Refacciones críticas y ordenes pendientes.</p>
                  </div>
                </div>
              </div>
              <div className="landing-preview-mobile">
                <strong>Portal cliente</strong>
                <p>Seguimiento por folio y estado del equipo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="caracteristicas" className="landing-features">
        <div className="landing-container landing-feature-grid">
          <div className="landing-feature-copy">
            <h2>Te presentamos nuestras características</h2>
            <p>
              Personaliza la forma en que llevas el control de tu negocio con una plataforma
              completamente moldeable a tus necesidades.
            </p>
            <ul>
              {FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="landing-feature-visual">
            <div className="landing-feature-card">
              <img src="/logo-srfix.webp" alt="Servicios Digitales MX" />
              <div>
                <strong>Control real para talleres</strong>
                <span>Recepción, técnicos, inventario, compras, finanzas, reportes y portal cliente.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="landing-pricing">
        <div className="landing-pricing-watermark">COMIENZA HOY MISMO</div>
        <div className="landing-container">
          <div className="landing-pricing-head">
            <h2>Planes de Pago</h2>
            <p>Toma el control de tu negocio con una sola aplicación.</p>
          </div>

          <div className="landing-pricing-grid">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`landing-plan-card ${plan.tone === "featured" ? "is-featured" : ""}`}
              >
                {plan.badge ? <span className="landing-plan-badge">{plan.badge}</span> : null}
                <div className="landing-plan-head">
                  <h3>{plan.name}</h3>
                  <div className="landing-plan-price">
                    <span>{plan.price}</span>
                    <small>MXN/mes</small>
                  </div>
                  <p>{plan.meta}</p>
                </div>

                <ul className="landing-plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <a
                  className={`landing-plan-button ${plan.tone === "featured" ? "is-featured" : ""}`}
                  href={`/billing?plan=${plan.code}`}
                >
                  {plan.button}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-proof">
        <div className="landing-container">
          <div className="landing-proof-stats">
            <div>
              <strong>+32</strong>
              <span>Estados en México</span>
              <p>Y haciendo crecer tu negocio</p>
            </div>
            <div>
              <strong>+150,000</strong>
              <span>Órdenes creadas</span>
              <p>Usando nuestra plataforma</p>
            </div>
          </div>

          <div className="landing-testimonials">
            {TESTIMONIALS.map((testimonial) => (
              <article key={testimonial.name} className="landing-testimonial-card">
                <div className="landing-stars">★★★★★</div>
                <p>{testimonial.text}</p>
                <div>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer id="contacto" className="landing-footer">
        <div className="landing-container landing-footer-top">
          <div className="landing-brand footer">
            <img src="/logo-srfix.webp" alt="Servicios Digitales MX" className="landing-brand-logo" />
            <span>
              Servicios Digitales <em>MX</em>
            </span>
          </div>

          <div className="landing-footer-links">
            <a href="#inicio">Inicio</a>
            <a href="#caracteristicas">Características</a>
            <a href="#planes">Planes</a>
            <a href="#contacto">Contacto</a>
          </div>

          <a className="landing-nav-cta" href="/interno">
            Iniciar sesión
          </a>
        </div>

        <div className="landing-container landing-footer-bottom">
          <span>&copy; 2026 Servicios Digitales MX. Reservados todos los derechos.</span>
          <div>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
