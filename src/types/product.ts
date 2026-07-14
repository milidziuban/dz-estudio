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

export type Category = "mesa" | "living";

export type CollectionId = "fiesta" | "sobremesa" | "nocturna" | "editorial";

export type ProductImage = {
  /** Seed para picsum.photos */
  seed: string;
  /** Color de la paleta usado como overlay/tinte */
  tint: ColorToken;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: Category;
  collection: CollectionId;
  colors: ColorToken[];
  /** Precio en ARS */
  price: number;
  description: string;
  medidas: string;
  material: string;
  cuidados: string;
  edition: { number: number; total: number };
  images: ProductImage[];
  /** Unidades vendidas (para ordenar por más vendidos) */
  sales: number;
  /** Fecha de alta (para ordenar por novedades) */
  createdAt: string;
};
