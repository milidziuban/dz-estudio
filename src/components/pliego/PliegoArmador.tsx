import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useCart } from "../../hooks/useCart";
import type { PliegoItem } from "../../hooks/usePliego";
import { trackAddToCart } from "../../lib/analytics";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import { SISTEMA, SOPORTE } from "../../lib/pliego";
import {
  ARMADO_ORDEN,
  ARMADO_SISTEMA,
  REGLAS,
  alternar,
  cantidad,
  entra,
  esSistema,
  mover,
  nombreRanura,
  primeraLibre,
  type Armado,
  type ArmadoCara,
  type ArmadoSlug,
} from "../../lib/pliego-armado";
import { botonPrimario, botonSecundario, rotulo, tituloSeccion } from "../../lib/pliego-clases";
import { topeDeCantidad, unidadesDisponibles } from "../../lib/stock";
import PliegoCheck from "./PliegoCheck";
import PliegoEspera from "./PliegoEspera";

// three.js pesa: se baja solo cuando el armador está por entrar en pantalla.
const PliegoArmador3D = lazy(() => import("./PliegoArmador3D"));

type PliegoArmadorProps = {
  items: PliegoItem[];
};

type Linea = { item: PliegoItem; cantidad: number };

const VISTAS: { cara: ArmadoCara; nombre: string }[] = [
  { cara: "frente", nombre: "Frente" },
  { cara: "atras", nombre: "Atrás" },
];

/** Cómo se llama cada ranura en los botones. Los auriculares solo van en
 *  las puntas, así que ahí se dice el lado. */
function etiquetaRanura(slug: ArmadoSlug, ranura: number): string {
  if (slug === "porta-auriculares") return ranura === 0 ? "Izquierda" : "Derecha";
  return String(ranura + 1);
}

function describir(armado: Armado, items: PliegoItem[]): string {
  const partes = ARMADO_ORDEN.flatMap((slug) => {
    const nombre = items.find((i) => i.pieza.slug === slug)?.pieza.nombre ?? slug;
    return (armado[slug] ?? []).map(
      (r) => `${nombre.toLowerCase()} en la ${nombreRanura(REGLAS[slug].cara, r)}`,
    );
  });
  return partes.length
    ? `Soporte 24 en 3D, con ${partes.join("; ")}. Arrastrá para girarlo.`
    : "Soporte 24 en 3D, sin accesorios. Arrastrá para girarlo.";
}

/** El armador: sumás accesorios al Soporte 24, elegís la ranura y lo ves en
 *  3D. Abajo, lo que suma y el botón para llevarse todo junto. */
export default function PliegoArmador({ items }: PliegoArmadorProps) {
  const [armado, setArmado] = useState<Armado>({});
  const [vista, setVista] = useState<ArmadoCara>("frente");
  const [pedido, setPedido] = useState(0);
  const [libre, setLibre] = useState(false);
  const [aviso, setAviso] = useState("");
  const [cerca, setCerca] = useState(false);
  const [sin3d, setSin3d] = useState(false);
  const [tactil] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const visorRef = useRef<HTMLDivElement>(null);
  const addToCart = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);

  // Recién a 600 px de entrar en pantalla se pide three.js.
  useEffect(() => {
    const visor = visorRef.current;
    if (!visor) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCerca(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(visor);
    return () => io.disconnect();
  }, []);

  const item = (slug: string) => items.find((i) => i.pieza.slug === slug)!;
  const nombre = (slug: ArmadoSlug) => item(slug).pieza.nombre;

  const mirar = (cara: ArmadoCara) => {
    setVista(cara);
    setPedido((n) => n + 1);
    setLibre(false);
  };

  /** Si lo que se tocó no se ve desde donde está la cámara, gira. */
  const mostrar = (slug: ArmadoSlug) => {
    const { cara } = REGLAS[slug];
    if (cara !== vista) mirar(cara);
  };

  const tocar = (slug: ArmadoSlug) => {
    const nuevo = alternar(armado, slug);
    if (nuevo === armado) return;
    setArmado(nuevo);
    const puesta = nuevo[slug] ?? [];
    if (puesta.length) {
      mostrar(slug);
      setAviso(`${nombre(slug)} en la ${nombreRanura(REGLAS[slug].cara, puesta[0])}.`);
    } else {
      setAviso(`Sacaste ${nombre(slug).toLowerCase()}.`);
    }
  };

  const elegirRanura = (slug: ArmadoSlug, ranura: number) => {
    const { cara, varias } = REGLAS[slug];
    const nuevo = varias ? alternar(armado, slug, ranura) : mover(armado, slug, ranura);
    if (nuevo === armado) return;
    setArmado(nuevo);
    mostrar(slug);
    const puesta = (nuevo[slug] ?? []).includes(ranura);
    setAviso(
      `${nombre(slug)} ${puesta ? "en" : "fuera de"} la ${nombreRanura(cara, ranura)}.`,
    );
  };

  const verConTodo = () => {
    setArmado(ARMADO_SISTEMA);
    mirar("frente");
    setAviso("Armado con todos los accesorios, como el Sistema completo.");
  };

  const vaciar = () => {
    setArmado({});
    setAviso("El soporte quedó sin accesorios.");
  };

  // ── Lo que suma ──
  const lineas: Linea[] = [
    { item: item(SOPORTE.slug), cantidad: 1 },
    ...ARMADO_ORDEN.filter((slug) => cantidad(armado, slug) > 0).map((slug) => ({
      item: item(slug),
      cantidad: cantidad(armado, slug),
    })),
  ];
  const conPrecio = lineas.every((l) => l.item.producto);
  const total = conPrecio
    ? lineas.reduce((s, l) => s + l.item.producto!.price * l.cantidad, 0)
    : null;
  const enVenta = lineas.every((l) => l.item.estado === "venta");
  const agotadas = lineas.filter((l) => l.item.estado === "agotada");

  const sistema = item(SISTEMA.slug);
  const ahorro =
    esSistema(armado) && sistema.estado === "venta" && sistema.producto && total !== null
      ? total - sistema.producto.price
      : null;

  const agregar = (lista: Linea[]) => {
    for (const { item: i, cantidad: qty } of lista) {
      const producto = i.producto;
      if (!producto) continue;
      const tope = topeDeCantidad(unidadesDisponibles(producto));
      const unidades = Math.min(qty, tope);
      addToCart(producto.slug, undefined, unidades, tope);
      trackAddToCart(producto, undefined, unidades);
    }
    openCart();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-xl flex-col gap-2">
        <p className={`${rotulo} text-pliego-tinta-suave`}>Armador</p>
        <h2 className={tituloSeccion}>Armalo a tu manera</h2>
        <p className="text-pliego-tinta-suave">
          Tocá un accesorio para ponerlo en el soporte y elegí en qué ranura va.
          Lo ves en 3D: giralo para mirarlo de costado o desde atrás.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-8">
        {/* Visor. En el celular queda pegado arriba mientras se tocan los
            accesorios de abajo: si no, el cambio pasa fuera de la pantalla. */}
        <div className="sticky top-16 z-10 -mx-5 flex flex-col gap-2 bg-pliego-fondo px-5 pb-3 pt-3 sm:-mx-8 sm:px-8 md:top-[4.5rem] lg:top-36 lg:mx-0 lg:gap-3 lg:self-start lg:px-0 lg:pb-0 lg:pt-0">
          <div
            ref={visorRef}
            className="relative aspect-[16/11] overflow-hidden rounded-[10px] border border-pliego-linea bg-pliego-superficie md:aspect-[16/10]"
          >
            {sin3d ? (
              <img
                src="/pliego/soporte-24-escritorio.webp"
                alt="Soporte 24 con el soporte celular, la bandeja y los auriculares en sus ranuras"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              cerca && (
                <Suspense
                  fallback={
                    <p className={`${rotulo} absolute inset-0 grid place-items-center text-pliego-tinta-suave`}>
                      Cargando el soporte
                    </p>
                  }
                >
                  <PliegoArmador3D
                    armado={armado}
                    vista={vista}
                    pedido={pedido}
                    descripcion={describir(armado, items)}
                    onError={() => setSin3d(true)}
                    onGiro={() => setLibre(true)}
                  />
                </Suspense>
              )
            )}

            {!sin3d && (
              <div
                role="group"
                aria-label="Vista del soporte"
                className="absolute bottom-3 left-3 flex rounded-sm border border-pliego-linea bg-pliego-superficie/90 p-0.5 backdrop-blur-sm"
              >
                {VISTAS.map((v) => {
                  const activa = !libre && vista === v.cara;
                  return (
                    <button
                      key={v.cara}
                      type="button"
                      aria-pressed={activa}
                      onClick={() => mirar(v.cara)}
                      className={cn(
                        "min-h-9 rounded-[1px] px-3.5 text-[13px] font-medium transition-colors",
                        activa
                          ? "bg-pliego-tinta text-pliego-fondo"
                          : "text-pliego-tinta hover:bg-pliego-linea/60",
                      )}
                    >
                      {v.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {!sin3d && (
            <p className={`${rotulo} text-pliego-tinta-suave`}>
              {tactil
                ? "Deslizá de costado para girar"
                : "Arrastrá para girar · rueda para acercar"}
            </p>
          )}
        </div>

        {/* Accesorios y resumen */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={verConTodo}
              className="inline-flex min-h-11 items-center text-[15px] font-medium underline underline-offset-4"
            >
              Ver con todos los accesorios
            </button>
            {lineas.length > 1 && (
              <button
                type="button"
                onClick={vaciar}
                className="inline-flex min-h-11 items-center text-[15px] text-pliego-tinta-suave underline underline-offset-4"
              >
                Empezar de cero
              </button>
            )}
          </div>

          <ul className="border-t border-pliego-linea">
            {ARMADO_ORDEN.map((slug) => {
              const regla = REGLAS[slug];
              const i = item(slug);
              const ranuras = armado[slug] ?? [];
              const activo = ranuras.length > 0;
              const sinLugar = !activo && primeraLibre(armado, slug) === null;
              // Las guías muestran siempre sus ranuras: se ponen de a una.
              const verRanuras = activo || regla.varias;

              return (
                <li key={slug} className="border-b border-pliego-linea py-4">
                  <button
                    type="button"
                    aria-pressed={activo}
                    disabled={sinLugar}
                    onClick={() => tocar(slug)}
                    className="flex w-full items-start gap-3.5 text-left disabled:cursor-not-allowed"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition-colors",
                        activo
                          ? "border-pliego-tinta bg-pliego-tinta text-pliego-fondo"
                          : "border-pliego-piedra",
                      )}
                    >
                      {activo && <PliegoCheck />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-medium">
                          {i.pieza.nombre}
                          {regla.varias && ranuras.length > 1 && (
                            <span className="font-pliego-mono text-sm text-pliego-tinta-suave">
                              {" "}
                              × {ranuras.length}
                            </span>
                          )}
                        </span>
                        <span className="font-pliego-mono text-sm text-pliego-tinta-suave">
                          {i.producto ? formatPrice(i.producto.price) : "Próximamente"}
                        </span>
                      </span>
                      <span className="text-[15px] leading-6 text-pliego-tinta-suave">
                        {sinLugar
                          ? "No queda lugar adelante: mové o sacá otro accesorio."
                          : i.pieza.bajada}
                      </span>
                    </span>
                  </button>

                  {verRanuras && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-[34px] sm:gap-2">
                      <span className={`${rotulo} mr-1 text-pliego-tinta-suave`}>
                        {regla.cara === "frente" ? "Ranura" : "Atrás"}
                      </span>
                      {regla.ranuras
                        .slice()
                        .sort((a, b) => a - b)
                        .map((r) => {
                          const puesta = ranuras.includes(r);
                          const posible = puesta || entra(armado, slug, r);
                          return (
                            <button
                              key={r}
                              type="button"
                              aria-pressed={puesta}
                              aria-label={`${i.pieza.nombre} en la ${nombreRanura(regla.cara, r)}`}
                              disabled={!posible}
                              title={posible ? undefined : "Ocupada: choca con otro accesorio"}
                              onClick={() => elegirRanura(slug, r)}
                              className={cn(
                                "min-h-9 min-w-9 rounded-sm border px-2 font-pliego-mono text-[13px] transition-colors",
                                puesta
                                  ? "border-pliego-tinta bg-pliego-tinta text-pliego-fondo"
                                  : "border-pliego-linea hover:border-pliego-tinta disabled:cursor-not-allowed disabled:border-dashed disabled:text-pliego-piedra disabled:opacity-60 disabled:hover:border-pliego-linea",
                              )}
                            >
                              {etiquetaRanura(slug, r)}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <p role="status" aria-live="polite" className="sr-only">
            {aviso}
          </p>

          {/* Resumen */}
          <div className="flex flex-col gap-5 rounded-[10px] border border-pliego-linea bg-pliego-superficie p-5 md:p-6">
            <div className="flex flex-col gap-2.5">
              <p className={`${rotulo} text-pliego-tinta-suave`}>Tu escritorio</p>
              <ul className="flex flex-col gap-1.5 text-[15px] leading-6">
                {lineas.map(({ item: i, cantidad: qty }) => (
                  <li key={i.pieza.slug} className="flex justify-between gap-4">
                    <span>
                      {qty > 1 && <span className="font-pliego-mono text-sm">{qty} × </span>}
                      {i.pieza.nombre}
                    </span>
                    <span className="font-pliego-mono text-sm text-pliego-tinta-suave">
                      {i.producto ? formatPrice(i.producto.price * qty) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
              {total !== null && (
                <p className="flex justify-between gap-4 border-t border-pliego-linea pt-3 font-medium">
                  Total
                  <span className="font-pliego-mono">{formatPrice(total)}</span>
                </p>
              )}
            </div>

            {enVenta ? (
              ahorro !== null && ahorro > 0 ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[15px] leading-6">
                    Armaste el Sistema completo: en una caja sale{" "}
                    <span className="font-pliego-mono">{formatPrice(ahorro)}</span> menos.
                  </p>
                  <button
                    type="button"
                    onClick={() => agregar([{ item: sistema, cantidad: 1 }])}
                    className={botonPrimario}
                  >
                    Llevar el Sistema completo
                  </button>
                  <button type="button" onClick={() => agregar(lineas)} className={botonSecundario}>
                    Prefiero las piezas sueltas
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => agregar(lineas)} className={botonPrimario}>
                  {lineas.length > 1 ? "Agregar todo al carrito" : "Agregar el soporte al carrito"}
                </button>
              )
            ) : agotadas.length ? (
              <PliegoEspera
                titulo="Avisame cuando vuelva"
                texto={`Sin stock por ahora: ${agotadas
                  .map((l) => l.item.pieza.nombre)
                  .join(", ")}. Te escribimos cuando haya unidades de nuevo.`}
              />
            ) : (
              <PliegoEspera
                titulo="Avisame cuando salga"
                texto="Todavía no está a la venta. Te escribimos una sola vez, cuando salgan las primeras unidades."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
