import { z } from "zod";

export const PROVINCIAS = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

// Métodos de envío tal como están configurados en Tienda Nube (Envío Nube).
// ⚠️ Los costos son estimados fijos: Tienda Nube los cotiza por código postal.
export const SHIPPING_OPTIONS = [
  {
    id: "retiro",
    label: "Retiro en el depósito",
    detail: "Tacuarí 7618, Guadalupe · Santa Fe Capital · lun a vie de 9 a 18",
    cost: 0,
  },
  {
    id: "andreani-sucursal",
    label: "Andreani a sucursal",
    detail: "3 a 6 días hábiles",
    cost: 7200,
  },
  {
    id: "andreani-domicilio",
    label: "Andreani a domicilio",
    detail: "3 a 6 días hábiles",
    cost: 9500,
  },
] as const;

export type ShippingId = (typeof SHIPPING_OPTIONS)[number]["id"];

// El CUIT es el que publica la tienda de Tienda Nube; el resto son
// ⚠️ placeholders: reemplazar por los datos bancarios reales antes de producción.
export const BANK_INFO = {
  banco: "[TU BANCO]",
  titular: "[TITULAR DE LA CUENTA]",
  cuit: "27-41860878-7",
  cbu: "[CBU]",
  alias: "[ALIAS]",
};

export const checkoutSchema = z.object({
  // Paso 1 — contacto
  email: z.string().email("Ingresá un email válido"),
  telefono: z.string().min(6, "Ingresá un teléfono válido"),
  nombre: z.string().min(2, "Contanos tu nombre"),
  apellido: z.string().min(2, "Falta tu apellido"),
  // Paso 2 — envío
  direccion: z.string().min(5, "Calle y número, así llega"),
  ciudad: z.string().min(2, "¿En qué ciudad estás?"),
  provincia: z
    .string()
    .refine(
      (value) => (PROVINCIAS as readonly string[]).includes(value),
      "Elegí tu provincia",
    ),
  cp: z.string().min(4, "Código postal inválido"),
  envio: z.enum(["retiro", "andreani-sucursal", "andreani-domicilio"], {
    required_error: "Elegí cómo lo recibís",
    invalid_type_error: "Elegí cómo lo recibís",
  }),
  // Paso 3 — pago
  pago: z.enum(["mp", "transferencia"]),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
