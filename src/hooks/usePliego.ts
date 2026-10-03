import {
  PIEZAS,
  PLIEGO_ETAPA,
  SISTEMA_COMPLETO,
  type PliegoFoto,
  type PliegoPieza,
} from "../lib/pliego";
import { productoAgotado } from "../lib/stock";
import type { Product } from "../types/product";
import { useProducts } from "./useProducts";

/** - "venta": se puede agregar al carrito.
 *  - "agotada": está cargada y en venta, pero sin stock.
 *  - "espera": todavía no se vende (etapa "espera", o no está en el panel). */
export type PliegoEstado = "venta" | "agotada" | "espera";

export type PliegoItem = {
  pieza: PliegoPieza;
  /** La fila del panel con el mismo slug, si ya está cargada. */
  producto?: Product;
  estado: PliegoEstado;
};

/** Las fotos de la ficha: las del panel si la pieza ya tiene, si no las
 *  provisorias del código. */
export function fotosDe({ pieza, producto }: PliegoItem): PliegoFoto[] {
  if (!producto?.images.length) return pieza.fotos;
  return producto.images.map((image, i) => ({
    src: image.src,
    alt: i === 0 ? pieza.fotos[0].alt : `${pieza.nombre}, foto ${i + 1}`,
  }));
}

/** Lo que costaría el Sistema completo comprando cada pieza por separado.
 *  null si alguna todavía no tiene precio cargado. */
export function sumaPorSeparado(items: PliegoItem[]): number | null {
  let total = 0;
  for (const { slug, cantidad } of SISTEMA_COMPLETO) {
    const producto = items.find((i) => i.pieza.slug === slug)?.producto;
    if (!producto) return null;
    total += producto.price * cantidad;
  }
  return total;
}

function estadoDe(producto: Product | undefined): PliegoEstado {
  if (PLIEGO_ETAPA !== "venta" || !producto) return "espera";
  return productoAgotado(producto) ? "agotada" : "venta";
}

/** Cada pieza de Pliego con su producto del panel. El contenido de la ficha
 *  es el del código (lib/pliego.ts); precio, stock y fotos reales, los del
 *  panel. Solo se cruzan productos de categoría Pliego: un slug repetido en
 *  los textiles no puede colarse en esta página. */
export function usePliego() {
  const { data: products = [], isLoading } = useProducts();
  const porSlug = new Map(
    products.filter((p) => p.category === "pliego").map((p) => [p.slug, p]),
  );

  const items: PliegoItem[] = PIEZAS.map((pieza) => {
    const producto = porSlug.get(pieza.slug);
    return { pieza, producto, estado: estadoDe(producto) };
  });

  return {
    items,
    isLoading,
    item: (slug: string | undefined) => items.find((i) => i.pieza.slug === slug),
  };
}
