import { CATEGORY_LABEL } from "../data/products";
import { COLOR_LABEL } from "./colors";
import { SITE } from "./site";
import type { Product } from "../types/product";

/** Marcado de datos estructurados (JSON-LD) para Google.
 *
 *  Es la ficha del producto escrita en el formato que lee el buscador: con
 *  esto el resultado puede salir con el precio y el "En stock" abajo del
 *  título, en vez de tres líneas de texto. Google sí ejecuta JavaScript, así
 *  que alcanza con inyectarlo desde React; los robots que no lo ejecutan
 *  (WhatsApp, Instagram) leen las etiquetas Open Graph, que están en el HTML
 *  servido — ver `index.html`.
 *
 *  Regla de oro: acá solo va lo que la página ya dice de verdad. Nada de
 *  reseñas inventadas, ni costos de envío —todavía no sabemos cuánto cobran
 *  Andreani y el Correo—, ni una política de devolución que el sitio no
 *  promete. Un dato de más acá es una penalización allá.
 */

export type JsonLd = Record<string, unknown>;

const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE.url}${path}`;

/** El producto: nombre, fotos, precio y disponibilidad. */
export function productJsonLd(product: Product): JsonLd {
  const url = abs(`/producto/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) => abs(image.src)),
    url,
    // No hay SKU cargado en la base: el slug es el identificador estable que
    // sí existe y no se repite.
    sku: product.slug,
    productID: String(product.id),
    category: CATEGORY_LABEL[product.category],
    color: product.colors.map((c) => COLOR_LABEL[c]).join(" y "),
    ...(product.material ? { material: product.material } : {}),
    ...(product.pesoGramos
      ? {
          weight: {
            "@type": "QuantitativeValue",
            value: product.pesoGramos,
            unitCode: "GRM",
          },
        }
      : {}),
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "ARS",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE.name },
    },
  };
}

/** El rastro de migas: Inicio › Tienda › Categoría › Producto.
 *  Es lo que hace que en Google salga esa ruta en vez de la URL cruda. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function productBreadcrumbJsonLd(product: Product): JsonLd {
  return breadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Tienda", path: "/tienda" },
    {
      name: CATEGORY_LABEL[product.category],
      path: `/tienda?categoria=${product.category}`,
    },
    { name: product.name, path: `/producto/${product.slug}` },
  ]);
}

/** La grilla de la tienda: la lista de fichas que hay abajo, en orden.
 *  Google la usa para entender que es una página de listado y seguir los
 *  links, no para mostrar precios: eso lo da el marcado de cada ficha. */
export function productListJsonLd(products: Product[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: abs(`/producto/${product.slug}`),
      name: product.name,
    })),
  };
}
