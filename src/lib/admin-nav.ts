import type { IconName } from "../components/admin/AdminIcon";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: IconName;
  /** `/admin` matchea exacto; el resto por prefijo */
  exact?: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Resumen",
    items: [
      { to: "/admin", label: "Inicio", icon: "inicio", exact: true },
      {
        to: "/admin/estadisticas",
        label: "Estadísticas",
        icon: "estadisticas",
      },
    ],
  },
  {
    title: "Ventas",
    items: [
      { to: "/admin/ventas", label: "Ventas", icon: "ventas" },
      { to: "/admin/clientes", label: "Clientes", icon: "clientes" },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { to: "/admin/productos", label: "Productos", icon: "productos" },
      { to: "/admin/precios", label: "Precios", icon: "precios" },
      {
        to: "/admin/distribucion",
        label: "Centro de distribución",
        icon: "distribucion",
      },
    ],
  },
  {
    title: "Crecimiento",
    items: [
      { to: "/admin/descuentos", label: "Descuentos", icon: "descuentos" },
      { to: "/admin/marketing", label: "Marketing", icon: "marketing" },
    ],
  },
  {
    title: "Configuración",
    items: [
      { to: "/admin/pagos", label: "Métodos de pago", icon: "pagos" },
      { to: "/admin/envios", label: "Métodos de envío", icon: "envios" },
    ],
  },
];
