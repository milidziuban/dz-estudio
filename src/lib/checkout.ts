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

export const SHIPPING_OPTIONS = [
  {
    id: "showroom",
    label: "Retiro en showroom",
    detail: "Palermo, CABA · coordinamos por WhatsApp",
    cost: 0,
  },
  {
    id: "andreani",
    label: "Andreani a domicilio",
    detail: "3 a 6 días hábiles",
    cost: 9500,
  },
  {
    id: "correo",
    label: "Correo Argentino",
    detail: "4 a 8 días hábiles",
    cost: 7200,
  },
] as const;

export type ShippingId = (typeof SHIPPING_OPTIONS)[number]["id"];

export const BANK_INFO = {
  banco: "Banco Galicia",
  titular: "DZ Estudio S.R.L.",
  cuit: "30-12345678-9",
  cbu: "0070999030000012345678",
  alias: "DZ.ESTUDIO.TEXTIL",
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
  envio: z.enum(["showroom", "andreani", "correo"], {
    required_error: "Elegí cómo lo recibís",
    invalid_type_error: "Elegí cómo lo recibís",
  }),
  // Paso 3 — pago
  pago: z.enum(["mp", "transferencia"]),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
