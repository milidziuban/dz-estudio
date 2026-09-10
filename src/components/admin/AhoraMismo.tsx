import { Link } from "react-router-dom";
import { useAdminProducts } from "../../hooks/useAdminProducts";
import { VENTANA_MINUTOS, useAhoraMismo } from "../../hooks/useAhoraMismo";
import { timeAgo } from "../../lib/admin";
import { formatPrice } from "../../lib/format";
import QueryError from "./QueryError";

/** "/producto/almohadones-rombo-rosa" → "Almohadón Rombo Rosa · 40 × 40 cm",
 *  y las páginas fijas con el nombre que tienen en el menú de la tienda. */
const PAGINA_FIJA: Record<string, string> = {
  "/": "Home",
  "/tienda": "Tienda",
  "/checkout": "Checkout",
  "/checkout/exito": "Gracias por tu compra",
  "/checkout/error": "Pago rechazado",
  "/contacto": "Contacto",
  "/pedido": "Seguimiento de pedido",
};

export default function AhoraMismo() {
  const { data, isLoading, error } = useAhoraMismo();
  const products = useAdminProducts();

  const nombrePorSlug = new Map(
    (products.data ?? []).map((product) => [product.slug, product.name]),
  );

  const nombreDePagina = (path: string): string => {
    if (PAGINA_FIJA[path]) return PAGINA_FIJA[path];
    if (path.startsWith("/producto/")) {
      const slug = path.slice("/producto/".length);
      return nombrePorSlug.get(slug) ?? slug;
    }
    return path;
  };

  const hayGente = (data?.sesiones ?? 0) > 0;

  return (
    <section className="rounded-2xl bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.15em]">
          <span
            aria-hidden="true"
            className={
              hayGente
                ? "h-2 w-2 animate-pulse rounded-full bg-verde"
                : "h-2 w-2 rounded-full bg-ink/20"
            }
          />
          Ahora mismo
        </h2>
        <p className="font-mono text-[11px] text-ink/65">
          últimos {VENTANA_MINUTOS} min · se actualiza solo
        </p>
      </div>

      {error ? (
        <div className="mt-4">
          <QueryError
            error={error}
            what="el movimiento en vivo"
            migration="supabase/migrations/20260910203819_embudo_en_la_base.sql"
          />
        </div>
      ) : isLoading ? (
        <p
          className="animate-pulse py-8 text-center font-mono text-xs uppercase tracking-widest text-ink/65"
          role="status"
        >
          ✦ Mirando…
        </p>
      ) : !data || !hayGente ? (
        <>
          <p className="mt-4 font-mono text-3xl font-medium tracking-tight text-ink/30">
            0
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink/65">
            Nadie en la tienda en este momento.
            {data?.ultimo && <> El último movimiento fue {timeAgo(data.ultimo)}.</>}
          </p>
        </>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <p>
              <span className="font-mono text-3xl font-medium tracking-tight">
                {data.sesiones}
              </span>
              <span className="ml-2 text-sm text-ink/65">
                {data.sesiones === 1 ? "persona" : "personas"}
              </span>
            </p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/65">
              {data.vistas} {data.vistas === 1 ? "vista" : "vistas"}
            </p>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                Qué están mirando
              </h3>
              <ul className="mt-3 space-y-2">
                {data.paginas.map((pagina) => (
                  <li
                    key={pagina.path}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="truncate">
                      {nombreDePagina(pagina.path)}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-ink/65">
                      {pagina.sesiones}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                Lo último que hicieron
              </h3>
              {data.eventos.length === 0 ? (
                <p className="mt-3 text-[11px] leading-relaxed text-ink/65">
                  Están mirando, pero todavía nadie agregó nada al carrito.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.eventos.map((evento, index) => (
                    <li
                      key={`${evento.createdAt}-${index}`}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        {evento.kind === "add_to_cart" ? (
                          <>
                            <span aria-hidden="true">✦</span> Agregó{" "}
                            {evento.slug
                              ? (nombrePorSlug.get(evento.slug) ?? evento.slug)
                              : "algo"}
                          </>
                        ) : (
                          <>
                            <span aria-hidden="true">✧</span> Empezó el checkout
                            {typeof evento.value === "number" && (
                              <> por {formatPrice(evento.value)}</>
                            )}
                          </>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                        {timeAgo(evento.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-ink/65">
            Una persona es una pestaña abierta, no un cliente distinto: quien
            vuelve mañana cuenta de nuevo.{" "}
            <Link to="/admin/estadisticas" className="underline">
              Ver el embudo completo →
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
