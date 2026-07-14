// Configuración central del sitio.
// ⚠️ Reemplazar los placeholders marcados antes de salir a producción.
export const SITE = {
  name: "DZ Estudio",
  tagline: "Textiles con carácter",
  description:
    "Textiles maximalistas y elegantes para mesa y living. Edición limitada, hechos en Argentina.",
  // Se toma de VITE_SITE_URL en producción (Vercel); fallback para desarrollo.
  url:
    (import.meta.env.VITE_SITE_URL as string | undefined) ??
    "https://dz-estudio.vercel.app",
  // ⚠️ Reemplazar por los datos reales de la marca
  email: "hola@dzestudio.com.ar",
  instagram: "dzestudio",
  instagramUrl: "https://instagram.com/dzestudio",
  // wa.me necesita el número con código de país, sin + ni espacios
  whatsapp: "5491112345678",
  whatsappUrl: "https://wa.me/5491112345678",
  showroom: {
    barrio: "Palermo, CABA",
    detalle: "Visitas con cita previa — coordinamos por WhatsApp",
  },
} as const;
