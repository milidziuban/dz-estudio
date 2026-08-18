import type { ShippingId } from "../lib/checkout";
import type { ColorToken, Product } from "./product";

/** Producto con los campos que solo interesan en el panel. */
export type AdminProduct = Product & {
  /** null = sin control de stock */
  stock: number | null;
  sku: string | null;
  /** Costo unitario en ARS. null = todavía no se cargó. */
  cost: number | null;
  /** true = el producto ya es un paquete de 2+ unidades (ej. "Pack x2"):
   *  el precio de lista sugerido en /admin/precios le aplica el descuento
   *  por combo directo, en vez de esperar a que el cliente lleve 2. */
  isBundle: boolean;
};

/** Estado del pago. Lo escribe el webhook de Mercado Pago o el panel. */
export type OrderStatus =
  | "pending"
  | "paid"
  | "rejected"
  | "cancelled"
  | "refunded";

/** Estado logístico, independiente del pago. */
export type ShippingStatus =
  | "pendiente"
  | "preparando"
  | "despachado"
  | "entregado";

export type PaymentMethod = "mp" | "transferencia";

/** Línea de una orden, tal como la escribe el checkout en `orders.items`. */
export type OrderItem = {
  slug: string;
  name: string;
  variant: string | null;
  variant_id: string | null;
  price: number;
  qty: number;
};

export type ShippingAddress = {
  direccion: string;
  ciudad: string;
  provincia: string;
  cp: string;
};

export type Order = {
  id: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingId;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  shippingCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  shippingStatus: ShippingStatus;
  trackingCode: string | null;
  adminNotes: string | null;
  mpPaymentId: string | null;
};

/** Cliente: no hay tabla, se agrupa por email desde las órdenes pagadas. */
export type Customer = {
  email: string;
  nombre: string;
  telefono: string | null;
  ciudad: string;
  provincia: string;
  ordersCount: number;
  /** De esas, las que efectivamente se cobraron */
  paidCount: number;
  /** Solo cuenta lo cobrado: pending y rejected no suman */
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
};

export type DiscountKind = "percent" | "fixed" | "free-shipping";

export type Discount = {
  id: string;
  createdAt: string;
  code: string;
  description: string | null;
  kind: DiscountKind;
  /** percent: 1-100 · fixed: ARS · free-shipping: se ignora */
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  uses: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

export type Subscriber = {
  id: string;
  createdAt: string;
  email: string;
  source: string;
  active: boolean;
};

export type PageView = {
  createdAt: string;
  path: string;
  referrer: string | null;
  sessionId: string;
  isNewSession: boolean;
};

// ── store_settings ────────────────────────────────────────────

export type PagosSettings = {
  mercadopago: {
    enabled: boolean;
    /** Cuotas sin interés que anuncia la tienda (las activa la cuenta de MP) */
    installments: number;
    installmentsLabel: string;
    /** Tope real de cuotas que ofrece el checkout de MP */
    maxInstallments: number;
  };
  transferencia: {
    enabled: boolean;
    discountPercent: number;
    banco: string;
    titular: string;
    cuit: string;
    cbu: string;
    alias: string;
  };
};

export type ShippingProvider = "andreani" | "correo-argentino";

export type ShippingOptionSetting = {
  id: string;
  label: string;
  detail: string;
  /** "vivo": el costo real lo calcula la transportista en el checkout.
   *  "fijo": el costo es este número, lo define el panel. */
  mode: "fijo" | "vivo";
  /** Costo fijo (mode "fijo") o de respaldo si la cotización en vivo
   *  no está configurada o falla (mode "vivo"). */
  cost: number;
  enabled: boolean;
  /** Solo en mode "vivo": a qué transportista y servicio cotizar. */
  provider?: ShippingProvider;
  service?: "sucursal" | "domicilio";
};

export type PaqueteEstandar = {
  largoCm: number;
  anchoCm: number;
  altoCm: number;
};

export type EnviosSettings = {
  options: ShippingOptionSetting[];
  /** Monto desde el que el envío es gratis. null = sin envío gratis */
  freeShippingFrom: number | null;
  /** Código postal del depósito que despacha, para cotizar Andreani/Correo. */
  origenCp: string;
  /** Paquete tipo en el que sale un pedido — son objetos blandos, no hace
   *  falta pedir medidas por producto para cotizar el volumen. */
  paquete: PaqueteEstandar;
};

export type DistributionLocation = {
  id: string;
  nombre: string;
  direccion: string;
  horario: string;
  /** Si el cliente puede retirar acá */
  retiro: boolean;
  principal: boolean;
};

export type DistribucionSettings = {
  locations: DistributionLocation[];
  /** Debajo de esta cantidad, el panel avisa "poco stock" */
  lowStockThreshold: number;
};

export type MarketingSettings = {
  gaId: string | null;
  instagram: string;
  whatsapp: string;
  marquee: string[];
  promos: {
    combo: { enabled: boolean; percent: number; minQty: number };
    transferencia: { enabled: boolean; percent: number };
  };
};

/** Parámetros de la calculadora de precios (/admin/precios). El descuento por
 *  combo y por transferencia se leen de `marketing.promos`: son los mismos
 *  que ya usa el carrito, no hace falta una segunda copia. */
export type PreciosSettings = {
  /** Margen de ganancia sobre el costo, en % (100 = duplicar el costo). */
  marginPercent: number;
};

export type StoreSettings = {
  pagos: PagosSettings;
  envios: EnviosSettings;
  distribucion: DistribucionSettings;
  marketing: MarketingSettings;
  precios: PreciosSettings;
};

export type SettingsKey = keyof StoreSettings;

// ── Formulario de producto del panel ──────────────────────────

export type ProductDraft = {
  id: number | null;
  slug: string;
  name: string;
  category: "almohadones" | "individuales";
  colors: ColorToken[];
  price: number;
  stock: number | null;
  sku: string;
  cost: number | null;
  isBundle: boolean;
  description: string;
  medidas: string;
  peso: string;
  /** Peso real en gramos para cotizar el envío. null = usar el default del panel. */
  pesoGramos: number | null;
  material: string;
  cuidados: string;
  inStock: boolean;
  images: { src: string; fit: "cover" | "contain"; background?: ColorToken }[];
  variants: { id: string; label: string; color: ColorToken }[];
};
