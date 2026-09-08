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

/** Cómo se cobra cada opción de envío.
 *  - "fijo": el costo es el número que define el panel.
 *  - "vivo": lo cotiza la transportista en el checkout (edge function
 *    `shipping-quote`); el número del panel es el de respaldo.
 *  - "a-coordinar": la tienda no muestra ningún precio ni lo suma al total.
 *    El pedido se paga solo por producto y el envío se cobra aparte, después
 *    de pasarle el costo a la clienta. */
export type ShippingMode = "fijo" | "vivo" | "a-coordinar";

// Métodos de envío.
//
// 07/09/2026 — Hasta tener las tarifas reales de Andreani y del Correo, la
// tienda no cotiza envíos: se ofrecen dos opciones, retiro y "a coordinar".
// Las cuatro de las transportistas quedan acá con `enabled: false` — no se
// borran, se prenden de un clic desde /admin cuando estén los números. La
// cotización en vivo (`shipping-quote`, `useShippingQuote`) sigue en su
// lugar, dormida, esperando a que se prendan.
export const SHIPPING_OPTIONS = [
  {
    id: "retiro",
    label: "Retiro en el depósito",
    detail: "Tacuarí 7618, Guadalupe · Santa Fe Capital · lun a vie de 9 a 20",
    mode: "fijo",
    cost: 0,
    enabled: true,
  },
  {
    id: "envio-a-coordinar",
    label: "Envío a coordinar",
    detail: "Te escribimos por WhatsApp con el costo antes de despachar",
    mode: "a-coordinar",
    cost: 0,
    enabled: true,
  },
  {
    id: "andreani-sucursal",
    label: "Andreani a sucursal",
    detail: "3 a 6 días hábiles",
    mode: "fijo",
    cost: 7200,
    enabled: false,
    provider: "andreani",
    service: "sucursal",
  },
  {
    id: "andreani-domicilio",
    label: "Andreani a domicilio",
    detail: "3 a 6 días hábiles",
    mode: "fijo",
    cost: 9500,
    enabled: false,
    provider: "andreani",
    service: "domicilio",
  },
  {
    id: "correo-sucursal",
    label: "Correo Argentino a sucursal",
    detail: "Cotización en vivo por código postal",
    mode: "vivo",
    cost: 6500,
    enabled: false,
    provider: "correo-argentino",
    service: "sucursal",
  },
  {
    id: "correo-domicilio",
    label: "Correo Argentino a domicilio",
    detail: "Cotización en vivo por código postal",
    mode: "vivo",
    cost: 8500,
    enabled: false,
    provider: "correo-argentino",
    service: "domicilio",
  },
] as const;

/** El envío de esta opción no se cotiza en la tienda: se cobra aparte. */
export const esACoordinar = (option: { mode: string }): boolean =>
  option.mode === "a-coordinar";

/** Lo mismo, pero cuando lo único que hay a mano es el id que quedó guardado
 *  en la orden (el panel, el seguimiento del pedido). El modo lo define el
 *  código: `store_settings` cambia textos y costos, no de qué tipo es cada
 *  opción. */
export const envioACoordinarPorId = (id: string): boolean =>
  SHIPPING_OPTIONS.some((option) => option.id === id && esACoordinar(option));

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

/** Campos de dirección: se piden solo si el pedido viaja. */
const CAMPOS_DIRECCION = ["direccion", "ciudad", "provincia", "cp"] as const;

type CampoDireccion = (typeof CAMPOS_DIRECCION)[number];

/**
 * La dirección es opcional en el esquema base y se exige recién en el
 * refinamiento: quien retira en el depósito no tiene por qué cargar calle,
 * ciudad, provincia ni código postal. El envío a coordinar sí los pide todos:
 * el paquete viaja igual y sin dirección no hay con qué cotizarlo después.
 */
export const checkoutSchema = z
  .object({
    // Paso 1 — contacto
    email: z.string().email("Ingresá un email válido"),
    telefono: z.string().min(6, "Ingresá un teléfono válido"),
    nombre: z.string().min(2, "Contanos tu nombre"),
    apellido: z.string().min(2, "Falta tu apellido"),
    // Paso 2 — envío
    direccion: z.string().optional(),
    ciudad: z.string().optional(),
    provincia: z.string().optional(),
    cp: z.string().optional(),
    envio: z.enum(
      [
        "retiro",
        "envio-a-coordinar",
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
    notas: z
      .string()
      .max(500, "Máximo 500 caracteres")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.envio === "retiro") return;

    const valor = (campo: CampoDireccion) => (data[campo] ?? "").trim();
    const exigir = (campo: CampoDireccion, ok: boolean, message: string) => {
      if (ok) return;
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [campo], message });
    };

    exigir(
      "direccion",
      valor("direccion").length >= 5,
      "Calle y número, así llega",
    );
    exigir("ciudad", valor("ciudad").length >= 2, "¿En qué ciudad estás?");
    exigir(
      "provincia",
      (PROVINCIAS as readonly string[]).includes(valor("provincia")),
      "Elegí tu provincia",
    );
    exigir("cp", valor("cp").length >= 4, "Código postal inválido");
  });

export type CheckoutData = z.infer<typeof checkoutSchema>;
