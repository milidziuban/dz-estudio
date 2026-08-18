export type ColorToken =
  | "pink"
  | "orange"
  | "celeste"
  | "verde"
  | "lila"
  | "petroleo"
  | "amarillo"
  | "ink"
  | "cream";

/** Las dos categorías que existen en Tienda Nube. */
export type Category = "almohadones" | "individuales";

export type ProductImage = {
  /** Foto real del catálogo, servida desde /public/productos */
  src: string;
  /** `contain` para los recortes sobre fondo blanco, `cover` para las fotos ambientadas */
  fit: "cover" | "contain";
  /** Color de fondo detrás de la foto (solo tiene efecto con `contain`) */
  background?: ColorToken;
};

/** Opción de un producto con variantes (ej. color), tal como está cargada en Tienda Nube. */
export type ProductVariant = {
  id: string;
  label: string;
  color: ColorToken;
  /** false = esta variante puntual no tiene stock. Ausente = disponible.
   *  El número real de unidades es un dato del panel, no viaja acá. */
  inStock?: boolean;
};

export type Product = {
  /** ID de Tienda Nube. Es creciente en el tiempo: sirve para ordenar por novedades. */
  id: number;
  slug: string;
  name: string;
  category: Category;
  colors: ColorToken[];
  /** Precio en ARS */
  price: number;
  description: string;
  medidas: string;
  peso?: string;
  /** Peso real en gramos, para cotizar el envío. Sin cargar, se usa el default del panel. */
  pesoGramos?: number;
  material?: string;
  cuidados?: string;
  /** Solo en los productos que tienen variantes cargadas en Tienda Nube */
  variants?: ProductVariant[];
  images: ProductImage[];
  inStock: boolean;
};
