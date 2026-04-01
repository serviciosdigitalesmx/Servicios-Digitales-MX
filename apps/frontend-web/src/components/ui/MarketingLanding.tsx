"use client";

import { useState } from "react";
import { IconMicrochip, IconRobot, IconCheck, IconStar, IconCheckCircular } from "./Icons";

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
    price: "350",
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
    price: "650",
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
    price: "1,200",
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
              <IconMicrochip width={18} height={18} style={{color: 'white'}} />
            </div>
            <span>Servicios Digitales <span style={{color: '#0066FF', fontStyle: 'italic'}}>MX</span></span>
          </div>
          
          <div className="sdmx-nav-links">
            <a href="#inicio">Inicio</a>
            <a href="#caracteristicas">Características</a>
            <a href="#planes">Planes</a>
            <a href="#contacto">Contacto</a>
            <a href="/login" className="sdmx-nav-cta">Comenzar</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="inicio" className="sdmx-hero">
        <div className="sdmx-container-6xl">
          <h1 className="sdmx-hero-title" style={{ position: 'relative', zIndex: 10 }}>
            Te presentamos el mejor software <br className="hidden md:block" />
            para administrar tu <span style={{color: '#0066FF'}}>taller de reparación</span>{' '}
            <span style={{display: 'inline-block', transform: 'translateY(12px)'}}>🔨</span>
          </h1>
          <p className="sdmx-hero-subtitle">Toma el control de tu negocio con una sola aplicación.</p>

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
              <a href="#planes" className="sdmx-btn-primary">Comenzar ahora</a>
            </div>
            <p className="sdmx-central-disclaimer">Suscríbete mensualmente de forma segura con Mercado Pago.</p>
          </div>

          {/* Dashboard Preview */}
          <div className="sdmx-mockups-wrapper">
            <div className="sdmx-mockup-desktop">
              <img src="/saas_dashboard_premium_1775008077938.png" alt="Dashboard Premium" />
            </div>
            <div className="sdmx-mockup-mobile">
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
            <p>Toma el control de tu negocio con una sola aplicacion</p>
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
                <IconMicrochip width={24} height={24} />
              </div>
              <span className="sdmx-footer-brand-text">Servicios Digitales <span>MX</span></span>
            </div>
            <div className="sdmx-footer-links">
              <a href="#inicio">Inicio</a>
              <a href="#caracteristicas">Características</a>
              <a href="#planes">Planes</a>
              <a href="#contacto">Contacto</a>
            </div>
            <a href="/login" className="sdmx-footer-cta">Iniciar sesión</a>
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

      <style jsx global>{`
        html, body {
          background-color: #0F172A !important;
          color: white !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: Inter, system-ui, sans-serif !important;
        }
        .sdmx-landing-page {
          background-color: #0F172A !important;
          color: white !important;
          min-height: 100vh !important;
          position: relative !important;
        }
        .sdmx-nav-fixed {
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 100 !important;
          padding: 0 !important;
        }
        .sdmx-nav-container {
          max-width: 100% !important;
          height: 4.5rem !important;
          background-color: rgba(15, 23, 42, 0.9) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0 2rem !important;
          border-radius: 0 !important;
        }
        .sdmx-nav-brand {
          color: white !important;
          font-weight: 900 !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          font-size: 1.25rem !important;
        }
        .sdmx-nav-brand span {
          color: #0066FF !important;
        }
        .sdmx-hero {
          padding-top: 10rem !important;
          padding-bottom: 8rem !important;
          background-color: #0F172A !important;
          text-align: center !important;
        }
        .sdmx-hero-title {
          font-size: 3rem !important;
          font-weight: 800 !important;
          line-height: 1.1 !important;
          margin-bottom: 2rem !important;
          color: white !important;
        }
        @media (min-width: 768px) {
          .sdmx-hero-title { font-size: 5.5rem !important; }
        }
        .sdmx-hero-subtitle {
          font-size: 1.5rem !important;
          color: rgba(255, 255, 255, 0.6) !important;
          margin-bottom: 4rem !important;
        }
        .sdmx-pill-button {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.6) !important;
          font-weight: 700 !important;
        }
        .sdmx-pill-button.is-active {
          background-color: white !important;
          color: #0F172A !important;
          border-color: white !important;
        }
        .sdmx-central-action {
          background-color: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(12px) !important;
          padding: 4rem 2rem !important;
          border-radius: 2rem !important;
          margin-top: 4rem !important;
          margin-bottom: 6rem !important;
        }
        .sdmx-pricing-card, .sdmx-pricing-card-featured {
          background-color: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(24px) !important;
          color: white !important;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.4) !important;
        }
        .sdmx-pricing-title, .sdmx-pricing-value {
          color: white !important;
        }
        .sdmx-pricing-desc, .sdmx-pricing-period, .sdmx-pricing-list li {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        .sdmx-pricing-icon-brand { color: #0066FF !important; }
        .sdmx-stats-section {
          background-color: #0F172A !important;
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding-top: 10rem !important;
        }
        .sdmx-stat-val { color: white !important; font-weight: 800 !important; }
        .sdmx-stat-val.brand { color: #0066FF !important; }
        .sdmx-stat-label, .sdmx-stat-desc { color: rgba(255, 255, 255, 0.6) !important; }
        .sdmx-testimonial-card {
          background-color: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 2.5rem !important;
        }
        .sdmx-testimonial-body { color: rgba(255, 255, 255, 0.8) !important; font-style: italic !important; }
        .sdmx-testimonial-name { color: white !important; font-weight: 700 !important; }
        .sdmx-testimonial-role { color: rgba(255, 255, 255, 0.5) !important; }
        .sdmx-features-title { color: white !important; }
        .sdmx-features-title span { color: #0066FF !important; }
        .sdmx-features-lead, .sdmx-features-subtitle { color: rgba(255, 255, 255, 0.6) !important; }
        .sdmx-footer { 
          background-color: #0F172A !important; 
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 6rem 0 !important;
        }
        .sdmx-footer-brand-text, .sdmx-footer-links a, .sdmx-footer-legal a, .sdmx-footer-bottom span {
          color: rgba(255, 255, 255, 0.5) !important;
        }
      `}</style>
    </div>
  );
}
