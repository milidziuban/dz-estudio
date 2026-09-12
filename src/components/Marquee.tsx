import { Fragment } from "react";

type MarqueeProps = {
  items: string[];
};

export default function Marquee({ items }: MarqueeProps) {
  const strip = (hidden: boolean) => (
    <div
      aria-hidden={hidden}
      className="flex shrink-0 animate-marquee items-center"
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className="whitespace-nowrap px-4 font-mono text-xs font-medium uppercase tracking-widest text-cream">
            {item}
          </span>
          <span className="text-xs text-pink" aria-hidden="true">
            ✦
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    // En mobile va en el flujo (scrollea con la página) y más angosta; en
    // desktop queda fija arriba de todo. Si cambia la altura, cambiar el
    // offset en StoreLayout (pt) y en Header (top).
    <div className="relative z-50 flex overflow-hidden bg-ink py-1.5 md:fixed md:inset-x-0 md:top-0 md:py-2.5">
      {strip(false)}
      {strip(true)}
    </div>
  );
}
