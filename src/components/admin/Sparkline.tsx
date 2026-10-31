type SparklineProps = {
  values: number[];
  className?: string;
};

/**
 * La forma del período en una línea, para las tarjetas de números. No tiene
 * ejes ni valores: dice "subió, bajó, pegó un pico", y el número exacto está
 * arriba. Va en SVG estirado (`preserveAspectRatio="none"`) con el trazo en
 * `non-scaling-stroke`, así se adapta al ancho de la tarjeta sin engordar.
 */
export default function Sparkline({ values, className }: SparklineProps) {
  const max = Math.max(...values, 0);
  if (values.length < 2 || max === 0) return null;

  const step = 100 / (values.length - 1);
  const puntos = values.map(
    (value, i) => `${(i * step).toFixed(2)},${(30 - (value / max) * 28).toFixed(2)}`,
  );
  const linea = `M${puntos.join(" L")}`;

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <path d={`${linea} L100,30 L0,30 Z`} className="fill-petroleo/10" />
      <path
        d={linea}
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-petroleo"
      />
    </svg>
  );
}
