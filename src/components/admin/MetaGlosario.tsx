/** Cómo se llama en Meta cada cosa de esta pantalla. Va cerrado: es para el
 *  día en que haya que entrar al Administrador de anuncios. */
const TERMINOS: { aca: string; enMeta: string; que: string }[] = [
  {
    aca: "La vieron",
    enMeta: "Alcance",
    que: "Personas distintas. Si alguien la vio tres veces, cuenta una.",
  },
  {
    aca: "Se vio",
    enMeta: "Impresiones",
    que: "Cada vez que apareció en una pantalla, aunque sea la misma persona.",
  },
  {
    aca: "Clics",
    enMeta: "Clics en el enlace",
    que: "Tocaron el botón del anuncio. Algunos se van antes de que cargue la tienda.",
  },
  {
    aca: "Entraron",
    enMeta: "Visitas a la página de destino",
    que: "Tocaron el botón y la tienda llegó a abrirse. Es el número que importa.",
  },
  {
    aca: "Por visita",
    enMeta: "Costo por visita a la página de destino",
    que: "Lo gastado dividido por la gente que entró. Cuanto más bajo, mejor.",
  },
  {
    aca: "Presupuesto",
    enMeta: "Presupuesto total",
    que: "Lo máximo que puede gastar esa publicación. No siempre lo gasta todo.",
  },
  {
    aca: "Compras según Meta",
    enMeta: "Compras",
    que: "Compras de gente que tocó un anuncio en los 7 días anteriores. Si compró más tarde o desde otro aparato, Meta puede no enterarse.",
  },
];

export default function MetaGlosario() {
  return (
    <details className="group rounded-2xl bg-white p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-mono text-xs font-medium uppercase tracking-[0.15em] [&::-webkit-details-marker]:hidden">
        Cómo se llama cada cosa en Meta
        <span
          aria-hidden="true"
          className="text-base leading-none transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {TERMINOS.map((t) => (
          <div key={t.aca}>
            <dt className="text-sm font-bold">
              {t.aca}
              <span className="ml-2 font-mono text-[11px] font-normal text-ink/65">
                {t.enMeta}
              </span>
            </dt>
            <dd className="mt-1 text-xs leading-relaxed text-ink/70">{t.que}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
