export type IconName =
  | "inicio"
  | "estadisticas"
  | "productos"
  | "precios"
  | "ventas"
  | "clientes"
  | "descuentos"
  | "marketing"
  | "contenido"
  | "pagos"
  | "envios"
  | "distribucion"
  | "salir"
  | "campana";

/** Paths de 24x24, stroke. Un solo lugar para todos los íconos del panel:
 *  no vale la pena traer una librería de íconos por diez formas. */
const PATHS: Record<IconName, string> = {
  inicio: "M4 11 12 4l8 7M6 10v9h12v-9",
  estadisticas: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  productos: "M4 8h16v12H4zM4 8l2-4h12l2 4M9 12h6",
  precios:
    "M20.59 13.41 12 4.83A2 2 0 0 0 10.5 4.24L4 4v6.5a2 2 0 0 0 .59 1.41l8.59 8.59a2 2 0 0 0 2.82 0l4.59-4.59a2 2 0 0 0 0-2.82ZM7 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
  ventas: "M6 7h12l1.5 13.5a1 1 0 0 1-1 1.5h-13a1 1 0 0 1-1-1.5L6 7Zm3 3V6a3 3 0 0 1 6 0v4",
  clientes:
    "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1",
  descuentos: "M8 8h.01M16 16h.01M7 17 17 7M4 4h16v16H4z",
  marketing: "M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Zm14-3a5 5 0 0 1 0 8",
  contenido: "M4 5h16v15H4zM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2",
  pagos: "M2 7h20v10H2zM2 11h20M6 15h3",
  envios: "M3 7h11v10H3zM14 10h4l3 3v4h-7M6.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  distribucion: "M3 20V9l9-5 9 5v11M9 20v-6h6v6M3 20h18",
  salir: "M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h9",
  campana:
    "M12 3a5 5 0 0 0-5 5v3.2c0 .5-.2 1-.5 1.4L5 15h14l-1.5-2.4c-.3-.4-.5-.9-.5-1.4V8a5 5 0 0 0-5-5ZM9.5 18a2.5 2.5 0 0 0 5 0",
};

type AdminIconProps = {
  name: IconName;
  className?: string;
};

export default function AdminIcon({ name, className }: AdminIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
