import type { Category, Product } from "../types/product";

// Catálogo espejo de Tienda Nube (tienda dzestudio, sincronizado 17/08/2026).
// Los ids son los de Tienda Nube; las fotos son las mismas, descargadas a
// /public/productos. Al dar de alta un producto allá, replicarlo acá.

export const CATEGORY_LABEL: Record<Category, string> = {
  almohadones: "Almohadones",
  individuales: "Individuales",
};

/** Copy y foto de portada de cada categoría para la home. */
export const CATEGORY_INTRO: Record<
  Category,
  {
    colorB: string;
    tagLabel: string;
    description: string;
    image: string;
    imageAlt: string;
    imageFit: "cover" | "contain";
  }
> = {
  almohadones: {
    colorB: "#2F5D62",
    tagLabel: "3 modelos · $23.000",
    description:
      "Fundas de 40x40 en rombos y rayas de dos colores. Llevando 2 o más, 10% de descuento.",
    image: "/productos/almohadon-rayas-blanco-negro.webp",
    imageAlt: "Almohadón de rayas blanco y negro",
    imageFit: "contain",
  },
  individuales: {
    colorB: "#F26430",
    tagLabel: "2 packs · desde $5.100",
    description:
      "Packs de dos individuales de 30x42. La versión doble es reversible: rayas de un lado, formas orgánicas del otro.",
    image: "/productos/individuales-simple-pack.webp",
    imageAlt: "Individuales de rayas blanco y negro puestos en la mesa",
    imageFit: "cover",
  },
};

const ALMOHADON_DESC =
  "Almohadón decorativo, textura suave y diseño versátil que combina con distintos ambientes.";

export const products: Product[] = [
  // ✧ Almohadones
  {
    id: 356622826,
    slug: "almohadones-rombo-rosa",
    name: "Almohadones Rombo Rosa",
    category: "almohadones",
    colors: ["pink", "orange"],
    price: 23000,
    description: ALMOHADON_DESC,
    medidas: "40 x 40 cm (aprox.)",
    peso: "350 g (aprox.)",
    images: [
      {
        src: "/productos/almohadon-rombo-rosa.webp",
        fit: "contain",
        background: "cream",
      },
    ],
    inStock: true,
  },
  {
    id: 361309976,
    slug: "almohadones-rayas-blanco-y-negro",
    name: "Almohadones Rayas Blanco y Negro",
    category: "almohadones",
    colors: ["ink", "cream"],
    price: 23000,
    description: ALMOHADON_DESC,
    medidas: "40 x 40 cm (aprox.)",
    peso: "350 g (aprox.)",
    images: [
      {
        src: "/productos/almohadon-rayas-blanco-negro.webp",
        fit: "contain",
        background: "cream",
      },
    ],
    inStock: true,
  },
  {
    id: 361310010,
    slug: "almohadones-rombo-celeste",
    name: "Almohadones Rombo Celeste",
    category: "almohadones",
    colors: ["celeste", "orange"],
    price: 23000,
    description: ALMOHADON_DESC,
    medidas: "40 x 40 cm (aprox.)",
    peso: "350 g (aprox.)",
    images: [
      {
        src: "/productos/almohadon-rombo-celeste.webp",
        fit: "contain",
        background: "cream",
      },
    ],
    inStock: true,
  },
  // ✦ Individuales
  {
    id: 357072093,
    slug: "individuales-doble-pack-x2",
    name: "Individuales Doble Pack x2",
    category: "individuales",
    colors: ["pink", "celeste"],
    price: 7100,
    description:
      "Pack de 2 individuales reversibles: de un lado diseño de rayas, del otro un diseño más orgánico, mismo color en ambas caras.",
    medidas: "30 x 42 cm cada uno · pack x2",
    peso: "400 g el pack (aprox.)",
    variants: [
      { id: "1564845157", label: "Celeste", color: "celeste" },
      { id: "1564845158", label: "Rosa", color: "pink" },
    ],
    images: [{ src: "/productos/individuales-doble-pack.webp", fit: "cover" }],
    inStock: true,
  },
  {
    id: 358182239,
    slug: "individuales-simple-pack-x2",
    name: "Individuales Simple Pack x2",
    category: "individuales",
    colors: ["ink", "cream"],
    price: 5100,
    description:
      "Pack de 2 individuales de una sola cara, en rayas blanco y negro. La base neutra para cualquier vajilla.",
    medidas: "30 x 42 cm cada uno · pack x2",
    images: [{ src: "/productos/individuales-simple-pack.webp", fit: "cover" }],
    inStock: true,
  },
];
