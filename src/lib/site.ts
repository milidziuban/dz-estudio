// Configuración central del sitio.
// ⚠️ Reemplazar los placeholders marcados antes de salir a producción.
export const SITE = {
  name: "DZ Estudio",
  tagline: "Maximalismo con criterio",
  description:
    "Almohadones e individuales estampados, diseñados y hechos en Argentina.",
  // Se toma de VITE_SITE_URL en producción (Vercel); fallback al dominio real.
  url:
    (import.meta.env.VITE_SITE_URL as string | undefined) ??
    "https://www.dz-estudio.com",
  email: "milagrosdziuban@hotmail.com",
  instagram: "dzestudio_",
  instagramUrl: "https://instagram.com/dzestudio_",
  // Para mostrar en pantalla
  whatsapp: "342 529 9662",
  // wa.me necesita código de país + el 9 de celular, sin +, sin 0 y sin 15
  whatsappUrl: "https://wa.me/5493425299662",
  // Punto de retiro configurado en Tienda Nube
  retiro: {
    nombre: "Depósito Santa Fe Ciudad",
    direccion: "Tacuarí 7618, Guadalupe, Santa Fe Capital",
    horario: "Lunes a viernes de 9 a 18",
  },
  cuit: "27-41860878-7",
} as const;
