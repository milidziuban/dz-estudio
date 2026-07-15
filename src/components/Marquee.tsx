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
          <span className="text-pink" aria-hidden="true">
            ✦
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex overflow-hidden bg-ink py-2.5">
      {strip(false)}
      {strip(true)}
    </div>
  );
}
