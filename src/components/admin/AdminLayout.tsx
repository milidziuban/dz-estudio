import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useOrderAlerts } from "../../hooks/useOrderAlerts";
import { ADMIN_NAV } from "../../lib/admin-nav";
import { cn } from "../../lib/cn";
import PageLoader from "../PageLoader";
import Seo from "../Seo";
import AdminIcon from "./AdminIcon";
import NotificationBell from "./NotificationBell";
import OrderToastStack from "./OrderToastStack";

function navClasses({ isActive }: { isActive: boolean }): string {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline-cream",
    isActive
      ? "bg-cream/[0.12] text-cream"
      : "text-cream/65 hover:bg-cream/[0.06] hover:text-cream",
  );
}

export default function AdminLayout() {
  const { email, nombre, signOut } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { alerts, esNuevo, unseenCount, markAllSeen, toasts, dismissToast } =
    useOrderAlerts();

  // Al navegar, el menú mobile se cierra solo
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // En el celular el sidebar está escondido: la barra de arriba dice dónde estás
  const seccionActual = ADMIN_NAV.flatMap((group) => group.items).find((item) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to),
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-8 overflow-y-auto bg-ink px-3 py-6">
      <Link to="/admin" className="rounded-lg px-3 focus-visible:outline-cream">
        <img
          src="/logo-extendido-cream.svg"
          alt="DZ Estudio"
          className="h-6 w-auto"
        />
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/60">
          Panel de gestión
        </p>
      </Link>

      <nav aria-label="Secciones del panel" className="flex-1 space-y-6">
        {ADMIN_NAV.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/60">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.exact}
                    className={navClasses}
                  >
                    {({ isActive }) => (
                      <>
                        <AdminIcon
                          name={item.icon}
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive && "text-pink",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-cream/15 px-3 pt-4">
        <p className="font-mono text-[11px] text-cream/70">
          {nombre ?? "Admin"}
        </p>
        <p className="truncate font-mono text-[11px] text-cream/60">{email}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-3 flex items-center gap-2 rounded font-mono text-[11px] uppercase tracking-[0.12em] text-cream/65 transition-colors hover:text-pink focus-visible:outline-cream"
        >
          <AdminIcon name="salir" className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <Seo title="Panel" noindex />

      {/* Sidebar fijo en desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        {sidebar}
      </aside>

      {/* Drawer en mobile */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", !menuOpen && "pointer-events-none")}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label="Cerrar menú"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
          className={cn(
            "absolute inset-0 bg-ink/50 transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform duration-300",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebar}
        </div>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink/10 bg-cream/95 px-5 py-3 backdrop-blur lg:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú del panel"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-ink/5 lg:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {seccionActual && (
            <p className="truncate font-mono text-[11px] uppercase tracking-[0.12em] lg:hidden">
              {seccionActual.label}
            </p>
          )}

          <div className="flex flex-1 items-center justify-end gap-4">
            <NotificationBell
              alerts={alerts}
              esNuevo={esNuevo}
              unseenCount={unseenCount}
              onOpen={markAllSeen}
            />
            <Link
              to="/"
              className="font-mono text-[11px] uppercase tracking-widest text-ink/65 transition-colors hover:text-ink"
            >
              Ver la tienda ↗
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-5 pb-16 pt-8 lg:px-10 lg:pt-10">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <OrderToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
