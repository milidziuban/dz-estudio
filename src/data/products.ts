import type { Category, ColorToken, Product } from "../types/product";

// Catálogo de respaldo: espejo de la tabla `products` de Supabase
// (sincronizado 30/08/2026). La tienda lee siempre de la base; esto es lo que
// se muestra si la consulta falla. Al cambiar un precio o un producto en el
// panel, actualizar también acá.

export const CATEGORY_LABEL: Record<Category, string> = {
  almohadones: "Almohadones",
  individuales: "Individuales",
};

/** Copy y foto de portada de cada categoría para la home. */
export const CATEGORY_INTRO: Record<
  Category,
  {
    colorB: ColorToken;
    tagLabel: string;
    description: string;
    image: string;
    imageAlt: string;
    imageFit: "cover" | "contain";
  }
> = {
  almohadones: {
    colorB: "petroleo",
    tagLabel: "3 modelos · $18.300",
    description:
      "Fundas de 40x40 en rombos y rayas de dos colores. Llevando 2 o más, 10% de descuento.",
    image: "/productos/almohadon-rayas-cama.jpg",
    imageAlt: "Almohadones de rayas blanco y negro sobre una cama",
    imageFit: "cover",
  },
  individuales: {
    colorB: "orange",
    tagLabel: "3 packs · desde $5.400",
    description:
      "Packs de dos individuales de 30x42, en gabardina impermeable. Los reversibles traen rayas de un lado y ondas del otro.",
    image: "/productos/individuales-reversibles-celeste-mesa.webp",
    imageAlt: "Individuales reversibles celestes puestos en una mesa de madera",
    imageFit: "cover",
  },
};

const CUIDADOS = "Lavar con agua fría, a ciclo suave o a mano. No secar al sol.";
const REVERSIBLE_DESC =
  "Dos individuales que son cuatro: de un lado rayas, del otro ondas, en COLORES las dos caras. Los das vuelta y la mesa cambia. Gabardina impermeable: el vino se queda arriba el tiempo suficiente para que llegues con un repasador.";

export const products: Product[] = [
  // ✧ Almohadones
  {
    id: 356622826,
    slug: "almohadones-rombo-rosa",
    name: "Almohadón Rombo Rosa · 40 × 40 cm",
    category: "almohadones",
    colors: ["pink", "orange"],
    price: 18300,
    description:
      "Rombos rosas y bordó sobre pana. La estampa ya la pone el almohadón: el resto del sillón puede quedarse tranquilo. Funda con solapa, se saca para lavar, relleno incluido.",
    medidas: "40 x 40 cm (aprox.)",
    peso: "350 g (aprox.)",
    material: "Pana estampada",
    cuidados: CUIDADOS,
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
    name: "Almohadón Rayas Blanco y Negro · 40 × 40 cm",
    category: "almohadones",
    colors: ["ink", "cream"],
    price: 18300,
    description:
      "Rayas negras sobre crudo, en pana. El único de la serie que no discute con nada: va con los rombos, va solo y va sobre cualquier color de sillón. Si estás armando de a dos, este es la mitad tranquila del par. Funda con solapa, se saca para lavar, relleno incluido.",
    medidas: "40 x 40 cm (aprox.)",
    peso: "350 g (aprox.)",
    material: "Pana estampada",
    cuidados: CUIDADOS,
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
    name: "Almohadón Rombo Celeste · 40 × 40 cm",
    category: "almohadones",
    colors: ["celeste"],
    price: 18300,
    description:
      "Rombos celestes y marrones sobre pana. El marrón lo ata a la madera y el celeste lo levanta, así que es el que mejor cae sobre sillones claros —lino crudo, beige, gris— y en cualquier ambiente donde haya madera cerca. Funda con solapa, se saca para lavar, relleno incluido.",
    medidas: "40 x 40 cm (aprox.)",
    peso: "350 g (aprox.)",
    material: "Pana estampada",
    cuidados: CUIDADOS,
    images: [
      {
        src: "/productos/almohadon-rombo-celeste.webp",
        fit: "contain",
        background: "cream",
      },
      { src: "/productos/almohadon-rombo-celeste-detalle.webp", fit: "cover" },
    ],
    inStock: true,
  },
  // ✦ Individuales
  {
    id: 357072093,
    slug: "individuales-reversibles-celeste",
    name: "Individuales Reversibles Celeste · Pack x2 · 30 × 42 cm",
    category: "individuales",
    colors: ["celeste", "orange"],
    price: 7200,
    description: REVERSIBLE_DESC.replace("COLORES", "celeste y marrón"),
    medidas: "30 x 42 cm cada uno · pack x2",
    peso: "400 g el pack (aprox.)",
    material: "Gabardina acrílica impermeable",
    cuidados: CUIDADOS,
    images: [
      {
        src: "/productos/individuales-reversibles-celeste-packshot.webp",
        fit: "contain",
        background: "cream",
      },
      { src: "/productos/individuales-reversibles-celeste-detalle.webp", fit: "cover" },
    ],
    inStock: true,
  },
  {
    id: 357072094,
    slug: "individuales-reversibles-rosa",
    name: "Individuales Reversibles Rosa · Pack x2 · 30 × 42 cm",
    category: "individuales",
    colors: ["pink", "celeste"],
    price: 7200,
    description: REVERSIBLE_DESC.replace("COLORES", "rosa y azul"),
    medidas: "30 x 42 cm cada uno · pack x2",
    peso: "400 g el pack (aprox.)",
    material: "Gabardina acrílica impermeable",
    cuidados: CUIDADOS,
    images: [
      {
        src: "/productos/individuales-reversibles-rosa-packshot.webp",
        fit: "contain",
        background: "cream",
      },
      {
        src: "https://glgyhzqwiutasicnwedv.supabase.co/storage/v1/object/public/productos/gemini-generated-image-smzibesmzibesmzi-1787090626340.jpg",
        fit: "cover",
      },
    ],
    inStock: true,
  },
  {
    id: 358182239,
    slug: "individuales-simple-pack-x2",
    name: "Individuales Rayas Blanco y Negro · Pack x2 · 30 × 42 cm",
    category: "individuales",
    colors: ["ink", "cream"],
    price: 5400,
    description:
      "Dos individuales de una sola cara, en rayas blancas y negras. Es la base: no compite con la vajilla, no pasa de moda y aguanta que le pongas encima lo que sea. Gabardina impermeable, así que lo que se vuelca se limpia con un paño en vez de terminar en el lavarropas.",
    medidas: "30 x 42 cm cada uno · pack x2",
    peso: "400 g el pack (aprox.)",
    material: "Gabardina acrílica impermeable",
    cuidados: CUIDADOS,
    images: [{ src: "/productos/individuales-simple-pack.webp", fit: "cover" }],
    inStock: true,
  },
];
