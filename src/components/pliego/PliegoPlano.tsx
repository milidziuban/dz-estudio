/** Vista frontal y lateral del Soporte 24, dibujadas como un plano: el
 *  guiño al oficio de la marca. Las coordenadas están en milímetros, así que
 *  las cotas son las medidas reales del plano de fabricación. */

const ranuras = [44.45, 132.45, 220.45, 308.45, 396.45, 484.45];

// El tamaño va en unidades del dibujo (mm): en el celular el plano se achica
// mucho, así que las cotas se agrandan para seguir leyéndose.
const cotaTexto =
  "font-pliego-mono fill-pliego-tinta-suave text-[18px] max-sm:text-[28px]";

export default function PliegoPlano() {
  return (
    <>
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className="font-pliego-mono text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-pliego-tinta-suave">
        Vista frontal
      </figcaption>
      <svg
        viewBox="-12 -12 752 176"
        className="block h-auto w-full"
        role="img"
        aria-label="Vista frontal del Soporte 24: 596,9 mm de largo, 114,3 mm de alto y unos 90,5 mm libres debajo del labio frontal"
      >
        <path
          d="M22 114.3H0V10A10 10 0 0 1 10 0H586.9A10 10 0 0 1 596.9 10V114.3H574.9"
          fill="none"
          className="stroke-pliego-tinta"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M2 23.8H594.9"
          fill="none"
          className="stroke-pliego-tinta-suave"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {ranuras.map((x) => (
          <rect
            key={x}
            x={x}
            y="9.3"
            width="68"
            height="5.2"
            rx="2.6"
            fill="none"
            className="stroke-pliego-tinta-suave"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          d="M0 120V152M596.9 120V152M0 146H596.9M604 0H636M604 114.3H636M630 0V114.3M60 23.8V114.3M54 23.8H66M54 114.3H66"
          fill="none"
          className="stroke-pliego-piedra"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <g className={cotaTexto}>
          <text x="298.45" y="140" textAnchor="middle">
            596,9
          </text>
          <text x="642" y="62">
            114,3
          </text>
          <text x="70" y="74">
            ≈ 90,5
          </text>
        </g>
      </svg>
    </figure>
    <figure className="m-0 flex w-[49%] min-w-[240px] flex-col gap-2">
      <figcaption className="font-pliego-mono text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-pliego-tinta-suave">
        Vista lateral
      </figcaption>
      <svg
        viewBox="-12 -12 372 176"
        className="block h-auto w-full"
        role="img"
        aria-label="Vista lateral del Soporte 24: 228,6 mm de profundidad y 114,3 mm de alto"
      >
        <rect
          x="0"
          y="0"
          width="228.6"
          height="114.3"
          rx="2"
          fill="none"
          className="stroke-pliego-tinta"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M0 23.8H14M214.6 57.2H228.6"
          fill="none"
          className="stroke-pliego-tinta-suave"
          strokeWidth="1"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M0 120V152M228.6 120V152M0 146H228.6M236 0H268M236 114.3H268M262 0V114.3"
          fill="none"
          className="stroke-pliego-piedra"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <g className={cotaTexto}>
          <text x="114.3" y="140" textAnchor="middle">
            228,6
          </text>
          <text x="272" y="62">
            114,3
          </text>
        </g>
      </svg>
    </figure>
    </>
  );
}
