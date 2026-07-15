import { Link } from "react-router-dom";
import Card from "./Card";
import Tag, { type TagColor } from "./Tag";

type CollectionCardProps = {
  title: string;
  description: string;
  /** Dupla bicolor: colorA manda en el bloque visual, colorB acentúa */
  colorA: string;
  colorB: string;
  tagColor: TagColor;
  tagLabel: string;
  to: string;
};

export default function CollectionCard({
  title,
  description,
  colorA,
  colorB,
  tagColor,
  tagLabel,
  to,
}: CollectionCardProps) {
  return (
    <Card className="flex flex-col">
      <div
        className="relative flex h-48 items-center justify-center md:h-56"
        style={{ backgroundColor: colorA }}
      >
        <span
          className="font-serif text-7xl italic md:text-8xl"
          style={{ color: colorB }}
          aria-hidden="true"
        >
          {title.charAt(0)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <Tag color={tagColor} className="self-start">
          {tagLabel}
        </Tag>
        <h3 className="text-2xl font-bold">
          Colección{" "}
          <em className="font-serif font-normal italic" style={{ color: colorB }}>
            {title}
          </em>
        </h3>
        <p className="text-sm leading-relaxed">{description}</p>
        <Link
          to={to}
          className="mt-auto font-mono text-xs font-medium uppercase tracking-widest underline decoration-1 underline-offset-4 transition-colors hover:text-pink"
        >
          Ver colección ✦
        </Link>
      </div>
    </Card>
  );
}
