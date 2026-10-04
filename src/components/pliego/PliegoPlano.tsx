/** Vistas frontal, superior y lateral del Soporte 24, dibujadas como un
 *  plano: el guiño al oficio de la marca. Las coordenadas están en
 *  milímetros, así que las cotas son las medidas reales, y coinciden con el
 *  modelo del armador 3D (PliegoArmador3D): las patas se abren 8° hacia
 *  afuera y las ranuras están caladas en la tapa, a 11,9 mm del borde. */

/** Borde izquierdo de cada ranura, en la vista superior. */
const ranuras = [44.45, 132.45, 220.45, 308.45, 396.45, 484.45];

// El tamaño va en unidades del dibujo (mm): en el celular el plano se achica
// mucho, así que las cotas se agrandan para seguir leyéndose.
const cotaTexto =
  "font-pliego-mono fill-pliego-tinta-suave text-[18px] max-sm:text-[28px]";
const rotuloVista =
  "font-pliego-mono text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-pliego-tinta-suave";

export default function PliegoPlano() {
  return (
    <>
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className={rotuloVista}>Vista frontal</figcaption>
      <svg
        viewBox="-12 -12 752 176"
        className="block h-auto w-full"
        role="img"
        aria-label="Vista frontal del Soporte 24: 596,9 mm de largo en los pies, 114,3 mm de alto, patas abiertas hacia afuera y unos 90,5 mm libres debajo del labio frontal"
      >
        {/* Pies hacia adentro, patas abiertas 8° y el pliegue de 10 mm que
            las une con la tapa. */}
        <path
          d="M22 114.3H0L14.57 8.61A10 10 0 0 1 24.47 0H572.43A10 10 0 0 1 582.33 8.61L596.9 114.3H574.9"
          fill="none"
          className="stroke-pliego-tinta"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M14.5 23.8H582.4"
          fill="none"
          className="stroke-pliego-tinta-suave"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
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
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className={rotuloVista}>Vista superior</figcaption>
      <svg
        viewBox="-12 -12 752 290"
        className="block h-auto w-full"
        role="img"
        aria-label="Vista superior del Soporte 24: 596,9 por 228,6 mm, con seis ranuras de 68 por 5,2 mm adelante y seis atrás, caladas en la tapa a 11,9 mm del borde"
      >
        {/* Lo de afuera son los pies; las dos líneas, donde la tapa se
            pliega hacia las patas. Adelante es abajo. */}
        <rect
          x="0"
          y="0"
          width="596.9"
          height="228.6"
          rx="2"
          fill="none"
          className="stroke-pliego-tinta"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M15.8 0V228.6M581.1 0V228.6"
          fill="none"
          className="stroke-pliego-tinta-suave"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {ranuras.flatMap((x) =>
          [9.3, 214.1].map((y) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="68"
              height="5.2"
              rx="2.6"
              fill="none"
              className="stroke-pliego-tinta-suave"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )),
        )}
        <path
          d="M0 234V266M596.9 234V266M0 260H596.9M604 0H636M604 228.6H636M630 0V228.6"
          fill="none"
          className="stroke-pliego-piedra"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <g className={cotaTexto}>
          <text x="298.45" y="254" textAnchor="middle">
            596,9
          </text>
          <text x="642" y="120">
            228,6
          </text>
        </g>
      </svg>
    </figure>
    <figure className="m-0 flex w-[49%] min-w-[240px] flex-col gap-2">
      <figcaption className={rotuloVista}>Vista lateral</figcaption>
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
