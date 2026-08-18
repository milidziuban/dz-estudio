import { Link } from "react-router-dom";
import { SITE } from "../lib/site";
import PaymentMethods from "./PaymentMethods";

const navItems = [
  { label: "Tienda", to: "/tienda" },
  { label: "Sobre nosotros", to: "/sobre-nosotros" },
  { label: "FAQ", to: "/faq" },
  { label: "Contacto", to: "/contacto" },
  { label: "Seguí tu pedido", to: "/pedido" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3 md:py-20 lg:px-12">
        <div>
          <img
            src="/logo-extendido-cream.svg"
            alt="DZ Estudio"
            className="h-6 w-auto"
          />
          <p className="mt-3 text-sm leading-relaxed text-cream/80">
            Almohadones e individuales estampados, hechos en Argentina.
          </p>
        </div>

        <nav aria-label="Secciones del sitio">
          <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-amarillo">
            ✦ Navegar
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="hover:underline hover:decoration-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-amarillo">
            ✧ Contacto
          </h3>
          <ul className="mt-4 space-y-2 font-mono text-xs uppercase tracking-wider">
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="hover:underline hover:decoration-2"
              >
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={SITE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:decoration-2"
              >
                @{SITE.instagram}
              </a>
            </li>
            <li>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:decoration-2"
              >
                WhatsApp
              </a>
            </li>
          </ul>
          <p className="mt-6 text-xs text-cream/60">
            Envíos: Andreani a sucursal o domicilio · Retiro gratis en{" "}
            {SITE.retiro.direccion}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-cream/20 px-5 py-10 sm:px-8 lg:px-12">
        <PaymentMethods tone="dark" />
      </div>

      <p className="border-t border-cream/20 px-5 py-5 text-center font-mono text-[11px] uppercase tracking-widest text-cream/60">
        © 2026 DZ Estudio ✦ CUIT {SITE.cuit} ✦ Maximalismo con criterio
      </p>
    </footer>
  );
}
