// Configuración central del sitio.
// ⚠️ Reemplazar los placeholders marcados antes de salir a producción.
export const SITE = {
  name: "DZ Estudio",
  tagline: "Maximalismo con criterio",
  description:
    "Almohadones e individuales estampados, diseñados y hechos en Argentina.",
  // El dominio va escrito acá y no sale de una variable de entorno: en Vercel
  // VITE_SITE_URL estaba cargada como "https://dz-estudio.vercel.app", así que
  // todos los canonical, los og:url y las fotos de las fichas le decían a
  // Google que la tienda vive en el dominio de Vercel. Es un dato que no
  // cambia —el apex redirige a www— y que no gana nada con ser configurable.
  url: "https://www.dz-estudio.com",
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
