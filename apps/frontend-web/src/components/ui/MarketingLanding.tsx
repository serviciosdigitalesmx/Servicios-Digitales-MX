"use client";

import { useState } from "react";
import Link from "next/link";
import { IconRobot, IconCheck, IconStar, IconCheckCircular } from "./Icons";

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
    name: 'Plan Esencial: "Adiós al Papel"',
    code: "esencial-350",
    price: "350",
    meta: "1 Usuario · 1 Sucursal",
    audience: "Para el técnico independiente que quiere verse como empresa seria desde el día uno.",
    button: "Comenzar ahora",
    tone: "light",
    features: [
      "Digitalización sustentable: elimina libretas y notas sueltas con control 100% digital",
      "Recepción con evidencia fotográfica y folio automático para evitar reclamos injustos",
      "Semáforo de prioridades en tiempo real para no perder fechas promesa",
      "Orden de servicio en PDF con envío inmediato por WhatsApp",
      "Portal de consulta para clientes con estatus de reparación",
      "Límite de 1 usuario y 1 sucursal"
    ]
  },
  {
    name: 'Plan Pro: "El Dueño Ausente"',
    code: "profesional-650",
    price: "549",
    meta: "1 Sucursal · Usuarios ilimitados",
    audience: "Para operar con control, delegar mejor y crecer sin vivir pegado al mostrador.",
    button: "Lo quiero ya",
    tone: "featured",
    badge: "El más popular",
    features: [
      "Todo lo del Esencial + Seguridad y bitácora de acciones críticas: control total de quién cambia precios o borra registros",
      "Gestión de stock e inventario real: control de refacciones con alertas de existencias",
      "Compras, gastos y proveedores: registra cada peso que sale para conocer tu utilidad neta",
      "Roles y permisos avanzados: define qué puede hacer tu técnico y qué solo tú como administrador",
      "PDF de cotización con fotos: vende más enviando presupuestos visuales automáticos por WhatsApp",
      "Panel del cliente en vivo: tu cliente ve el avance y fotos de su reparación sin llamarte",
      "Sistema de referidos: herramientas para que tus clientes te traigan más clientes"
    ]
  },
  {
    name: 'Plan Business: "Control Total Multi-Sede"',
    code: "elite-1200",
    price: "850",
    meta: "Usuarios ilimitados · Multi-sucursal",
    audience: "Para empresarios que necesitan visibilidad global, auditoría y control entre sucursales.",
    button: "Hablar con ventas",
    tone: "light",
    features: [
      "Gestión multi-sucursal global para controlar inventarios, personal y ventas desde un solo integrador",
      "Módulo de finanzas e inteligencia con rentabilidad, egresos y flujo de caja real",
      "Seguridad de élite y auditoría IP con rastreo de movimientos por usuario",
      "Reportes consolidados con KPIs por sucursal o visión global",
      "Infraestructura de máxima velocidad para reportes pesados y operación de alto volumen",
      "Usuarios ilimitados con roles y permisos personalizados"
    ]
  }
];

const TESTIMONIALS = [
  {
    name: "Anahí G.",
    role: "Taller de Celulares",
    text: '"Gracias a Servicios Digitales MX, mi taller ha ganado mucha eficiencia. Llevar el control de inventario es sencillo."'
  },
  {
    name: "Carlos M.",
    role: "Servicio Automotriz",
    text: '"SDMX transformó la manera en que gestiono mi taller. Ahora todo está centralizado y he reducido errores."'
  },
  {
    name: "María M.",
    role: "Centro Técnico",
    text: '"Desde que implementé Servicios Digitales MX, la organización ha mejorado notablemente. Puedo seguir cada reparación."'
  }
];

function getChipColor(index: number) {
  const colors = [
    "sdmx-chip-indigo",
    "sdmx-chip-blue",
    "sdmx-chip-brand",
    "sdmx-chip-orange",
    "sdmx-chip-pink",
    "sdmx-chip-purple",
    "sdmx-chip-red",
    "sdmx-chip-brand-bold",
    "sdmx-chip-rose",
    "sdmx-chip-slate",
    "sdmx-chip-yellow",
    "sdmx-chip-brand",
    "sdmx-chip-yellow-alert"
  ];
  return colors[index % colors.length];
}

export function MarketingLanding() {
  const [tab, setTab] = useState("recepcion");

  return (
    <div className="sdmx-landing-page">
      {/* NAVBAR */}
      <nav className="sdmx-nav-fixed">
        <div className="sdmx-nav-container">
          <div className="sdmx-nav-brand">
            <div className="sdmx-nav-logo-box">
              <img src="/logo-sdmx-phone-transparent.png" alt="Servicios Digitales MX" className="sdmx-nav-brandmark" />
            </div>
            <span>Servicios Digitales <span>MX</span></span>
          </div>
          
          <div className="sdmx-nav-links">
            <a href="#inicio">Inicio</a>
            <a href="#caracteristicas">Características</a>
            <a href="#planes">Planes</a>
            <a href="#contacto">Contacto</a>
            <Link href="/login" className="sdmx-nav-cta" style={{cursor: 'pointer', position: 'relative', zIndex: 9999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>Comenzar</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="inicio" className="sdmx-hero">
        <div className="sdmx-container-6xl">
          <div className="sdmx-hero-kicker">SOFTWARE OPERATIVO PARA TALLERES Y SERVICIOS TÉCNICOS [v1.0.3]</div>
          <h1 className="sdmx-hero-title" style={{ position: 'relative', zIndex: 10 }}>
            Convierte tu taller en una <br className="hidden md:block" />
            <span>operación profesional</span>{' '}
            <span style={{display: 'inline-block', transform: 'translateY(12px)'}}>⚡</span>
          </h1>
          <p className="sdmx-hero-subtitle">Recepción, seguimiento técnico, archivo, clientes, inventario y finanzas en una sola cabina de mando.</p>

          {/* Pill Navigation */}
          <div className="sdmx-pills-row">
            <button 
              onClick={() => setTab("recepcion")} 
              className={`sdmx-pill-button ${tab === "recepcion" ? "is-active" : ""}`}
            >
              Recepción
            </button>
            <span className="sdmx-pill-separator"></span>
            
            <button 
              onClick={() => setTab("inventario")} 
              className={`sdmx-pill-button ${tab === "inventario" ? "is-active" : ""}`}
            >
              Inventario
            </button>
            <span className="sdmx-pill-separator"></span>

            <button 
              onClick={() => setTab("finanzas")} 
              className={`sdmx-pill-button ${tab === "finanzas" ? "is-active" : ""}`}
            >
              Finanzas
            </button>
            <span className="sdmx-pill-separator"></span>

            <button 
              onClick={() => setTab("clientes")} 
              className={`sdmx-pill-button ${tab === "clientes" ? "is-active" : ""}`}
            >
              Clientes
            </button>
          </div>

          {/* Function Chips */}
          <div className="sdmx-chips-container">
            {MODULE_CHIPS.map((chip, i) => (
              <div key={chip} className={`sdmx-chip ${getChipColor(i)}`}>{chip}</div>
            ))}
          </div>

          {/* CTA Block */}
          <div className="sdmx-central-action">
            <div className="sdmx-central-buttons">
              <Link href="/login" className="sdmx-btn-primary" style={{cursor: 'pointer', position: 'relative', zIndex: 9999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>Comenzar ahora</Link>
            </div>
            <p className="sdmx-central-disclaimer">Suscríbete mensualmente de forma segura con Mercado Pago.</p>
          </div>

          {/* Dashboard Preview */}
          <div className="sdmx-mockups-wrapper sdmx-glass" style={{borderRadius: 'var(--sdmx-radius-lg)', padding: '2rem'}}>
            <div className="sdmx-mockup-desktop sdmx-brand-showcase">
              <div className="sdmx-brand-board">
                <div className="sdmx-brand-board-top">
                  <div className="sdmx-brand-board-logo">
                    <img src="/logo-sdmx-phone-transparent.png" alt="Servicios Digitales MX" />
                  </div>
                  <div>
                    <span className="sdmx-brand-board-kicker">CABINA SDMX</span>
                    <h3>Operación completa para talleres modernos</h3>
                    <p>Recepción, técnico, clientes, archivo, inventario y finanzas conectados bajo una sola vista.</p>
                  </div>
                </div>

                <div className="sdmx-brand-flow">
                  <div className="sdmx-brand-step">
                    <strong>Recepción</strong>
                    <span>Folio, evidencia y alta rápida</span>
                  </div>
                  <div className="sdmx-brand-step">
                    <strong>Mesa técnica</strong>
                    <span>Prioridades, tareas y seguimiento</span>
                  </div>
                  <div className="sdmx-brand-step">
                    <strong>Control total</strong>
                    <span>Archivo, finanzas y trazabilidad</span>
                  </div>
                </div>

                <div className="sdmx-brand-metrics">
                  <div className="sdmx-brand-metric">
                    <span>Expedientes claros</span>
                    <strong>100%</strong>
                  </div>
                  <div className="sdmx-brand-metric">
                    <span>Seguimiento visible</span>
                    <strong>24/7</strong>
                  </div>
                  <div className="sdmx-brand-metric">
                    <span>Control operativo</span>
                    <strong>360°</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="sdmx-mockup-mobile" style={{border: '4px solid var(--sdmx-bg-deep)', boxShadow: '0 0 30px rgba(0,0,0,0.5)'}}>
              <img src="/mobile_app_mockup_1775008092391.png" alt="Mobile Tracking" />
            </div>
          </div>
        </div>
      </section>

      {/* CARACTERISTICAS */}
      <section id="caracteristicas" className="sdmx-features-section">
        <div className="sdmx-container-7xl">
          <h2 className="sdmx-features-title">Te presentamos nuestras <span>características</span></h2>
          <p className="sdmx-features-subtitle">Toma el control de tu negocio con una sola aplicacion.</p>

          <div className="sdmx-features-grid">
            <div className="sdmx-features-text-box">
              <p className="sdmx-features-lead">Personaliza la forma en que llevas el control de tu negocio con una plataforma completamente moldeable a tus necesidades.</p>
              <ul className="sdmx-features-list">
                {FEATURES.map((feature) => (
                  <li key={feature}>
                    <div className="sdmx-features-icon"><IconCheck width={12} height={12} /></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sdmx-features-image-wrap">
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" alt="UI App" />
            </div>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="sdmx-pricing-section">
        <div className="sdmx-container-7xl" style={{position: 'relative', zIndex: 10}}>
          <div className="sdmx-pricing-head">
            <h2>Planes de Pago</h2>
            <p>Elige el nivel de control que necesita tu taller hoy y escala sin cambiar de sistema mañana.</p>
          </div>

          <div className="sdmx-pricing-grid">
            {PLANS.map((plan, i) => (
              <div 
                key={plan.name} 
                className={plan.tone === 'featured' ? 'sdmx-pricing-card-featured' : `sdmx-pricing-card ${i === 0 ? 'left' : 'right'}`}
              >
                {plan.badge && (
                  <div className="sdmx-pricing-badge-wrap">
                    <span className="sdmx-pricing-badge">{plan.badge}</span>
                  </div>
                )}
                
                <div className={plan.tone === 'featured' ? 'sdmx-pricing-featured-header' : 'sdmx-pricing-header'}>
                  <h3 className="sdmx-pricing-title">{plan.name}</h3>
                  <p className="sdmx-pricing-audience">{plan.audience}</p>
                  <div className="sdmx-pricing-amount-row">
                    <span className="sdmx-pricing-currency">$</span>
                    <span className="sdmx-pricing-value">{plan.price}</span>
                    <span className="sdmx-pricing-period">MXN/mes</span>
                  </div>
                  <p className="sdmx-pricing-desc">{plan.meta}</p>
                </div>

                <ul className="sdmx-pricing-list">
                  {plan.features.map((feature, j) => (
                    <li key={feature}>
                      {feature} 
                      {j === plan.features.length - 1 ? (
                        <IconStar width={16} height={16} className={plan.tone === 'featured' ? '' : 'sdmx-pricing-feature-special'} />
                      ) : (
                        <IconCheckCircular width={16} height={16} className={plan.tone === 'featured' ? '' : 'sdmx-pricing-icon-brand'} />
                      )}
                    </li>
                  ))}
                </ul>

                <a 
                  href={`/register?plan=${plan.code}`} 
                  className={plan.tone === 'featured' ? 'sdmx-pricing-btn-white' : 'sdmx-pricing-btn-primary'}
                >
                  {plan.button}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS & TESTIMONIALS */}
      <section className="sdmx-stats-section">
        <img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg" className="sdmx-stats-map" alt="Map" />
        <div className="sdmx-container-7xl">
          <div className="sdmx-stats-grid">
            <div className="sdmx-stat-box">
              <span className="sdmx-stat-val">+32</span>
              <span className="sdmx-stat-label">Estados en México</span>
              <p className="sdmx-stat-desc">Y haciendo crecer tu negocio</p>
            </div>
            <div className="sdmx-stat-box">
              <span className="sdmx-stat-val brand">+150,000</span>
              <span className="sdmx-stat-label">Órdenes creadas</span>
              <p className="sdmx-stat-desc">Usando nuestra plataforma</p>
            </div>
          </div>

          <div className="sdmx-testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="sdmx-testimonial-card">
                <div className="sdmx-stars">
                  <div style={{display: 'flex', gap: '0.25rem', justifyContent: 'center'}}>
                    <IconStar fill="currentColor" width={16} height={16} /><IconStar fill="currentColor" width={16} height={16} /><IconStar fill="currentColor" width={16} height={16} /><IconStar fill="currentColor" width={16} height={16} /><IconStar fill="currentColor" width={16} height={16} />
                  </div>
                </div>
                <p className="sdmx-testimonial-body">{t.text}</p>
                <div className="sdmx-testimonial-author">
                  <div className="sdmx-testimonial-avatar"></div>
                  <div>
                    <p className="sdmx-testimonial-name">{t.name}</p>
                    <p className="sdmx-testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="sdmx-footer">
        <div className="sdmx-container-7xl">
          <div className="sdmx-footer-top">
            <div className="sdmx-footer-brand">
              <div className="sdmx-footer-logo-box">
                <img src="/logo-sdmx-phone-transparent.png" alt="Servicios Digitales MX" className="sdmx-footer-brandmark" />
              </div>
              <span className="sdmx-footer-brand-text">Servicios Digitales <span>MX</span></span>
            </div>
            <div className="sdmx-footer-links">
              <a href="#inicio">Inicio</a>
              <a href="#caracteristicas">Características</a>
              <a href="#planes">Planes</a>
              <a href="#contacto">Contacto</a>
            </div>
            <Link href="/login" className="sdmx-footer-cta" style={{cursor: 'pointer', position: 'relative', zIndex: 9999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>Iniciar sesión</Link>
          </div>
          <div className="sdmx-footer-bottom">
            <span>&copy; 2026 Servicios Digitales MX. Reservados todos los derechos.</span>
            <div className="sdmx-footer-legal">
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
