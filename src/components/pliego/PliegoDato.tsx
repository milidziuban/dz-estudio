import { cn } from "../../lib/cn";

type PliegoDatoProps = {
  rotulo: string;
  valor: string;
  className?: string;
};

/** Un dato de plano: rótulo en mayúsculas arriba y la medida en IBM Plex
 *  Mono. Va dentro de un <dl>. */
export default function PliegoDato({ rotulo, valor, className }: PliegoDatoProps) {
  return (
    <div className={className}>
      <dt className="font-pliego-mono text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-pliego-tinta-suave">
        {rotulo}
      </dt>
      <dd className={cn("mt-2 font-pliego-mono text-sm leading-5 text-pliego-tinta")}>
        {valor}
      </dd>
    </div>
  );
}
