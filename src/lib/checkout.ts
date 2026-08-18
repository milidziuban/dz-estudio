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

// Métodos de envío. Retiro y Andreani tienen costo fijo (Andreani todavía
// no tiene credenciales de API cargadas — son las que da el comercial de
// cuenta, no se autogestionan). Correo Argentino cotiza en vivo por código
// postal a través de la edge function `shipping-quote`; el costo acá abajo
// es el que se usa si esa cotización no está configurada o falla.
export const SHIPPING_OPTIONS = [
  {
    id: "retiro",
    label: "Retiro en el depósito",
    detail: "Tacuarí 7618, Guadalupe · Santa Fe Capital · lun a vie de 9 a 18",
    mode: "fijo",
    cost: 0,
  },
  {
    id: "andreani-sucursal",
    label: "Andreani a sucursal",
    detail: "3 a 6 días hábiles",
    mode: "fijo",
    cost: 7200,
    provider: "andreani",
    service: "sucursal",
  },
  {
    id: "andreani-domicilio",
    label: "Andreani a domicilio",
    detail: "3 a 6 días hábiles",
    mode: "fijo",
    cost: 9500,
    provider: "andreani",
    service: "domicilio",
  },
  {
    id: "correo-sucursal",
    label: "Correo Argentino a sucursal",
    detail: "Cotización en vivo por código postal",
    mode: "vivo",
    cost: 6500,
    provider: "correo-argentino",
    service: "sucursal",
  },
  {
    id: "correo-domicilio",
    label: "Correo Argentino a domicilio",
    detail: "Cotización en vivo por código postal",
    mode: "vivo",
    cost: 8500,
    provider: "correo-argentino",
    service: "domicilio",
  },
] as const;

export type ShippingId = (typeof SHIPPING_OPTIONS)[number]["id"];

/** Depósito principal — desde donde se cotiza el envío. */
export const ORIGEN_CP_DEFAULT = "3000";

/** Paquete tipo: son objetos textiles blandos, salen todos en el mismo
 *  tipo de paquete sin importar el producto. */
export const PAQUETE_DEFAULT_CM = { largoCm: 40, anchoCm: 30, altoCm: 10 };

/** Peso a usar cuando un producto no tiene peso_gramos cargado. */
export const PESO_GRAMOS_DEFAULT = 400;

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
  envio: z.enum(
    [
      "retiro",
      "andreani-sucursal",
      "andreani-domicilio",
      "correo-sucursal",
      "correo-domicilio",
    ],
    {
      required_error: "Elegí cómo lo recibís",
      invalid_type_error: "Elegí cómo lo recibís",
    },
  ),
  // Paso 3 — pago
  pago: z.enum(["mp", "transferencia"]),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
