/** Supabase devuelve como mucho 1.000 filas por pedido (el tope de fábrica),
 *  aunque se le pida un `limit` más grande. Con 2.258 visitas en la base al
 *  24/11/2026, un rango largo perdía las más viejas sin avisar. */
const PAGINA = 1000;

type Respuesta<T> = { data: T[] | null; error: unknown };

/**
 * Trae todas las filas de una consulta, de a mil, hasta `tope`.
 * `pedir` recibe los bordes del tramo y tiene que pasárselos a `.range()`.
 * La consulta necesita un orden estable: sin él, las páginas se pisan.
 */
export async function leerTodo<T>(
  pedir: (desde: number, hasta: number) => PromiseLike<Respuesta<T>>,
  tope = 20000,
): Promise<T[]> {
  const filas: T[] = [];
  while (filas.length < tope) {
    const { data, error } = await pedir(
      filas.length,
      filas.length + PAGINA - 1,
    );
    if (error) throw error;
    const tramo = data ?? [];
    filas.push(...tramo);
    if (tramo.length < PAGINA) break;
  }
  return filas;
}
