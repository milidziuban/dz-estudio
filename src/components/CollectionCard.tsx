import { Link } from "react-router-dom";
import { COLOR_HEX } from "../lib/colors";
import type { ColorToken } from "../types/product";
import Card from "./Card";
import Tag, { type TagColor } from "./Tag";

type CollectionCardProps = {
  title: string;
  description: string;
  /** Foto de un producto de la categoría */
  image: string;
  imageAlt: string;
  /** `contain` para los recortes sobre fondo blanco */
  imageFit: "cover" | "contain";
  /** Color de acento de la dupla */
  colorB: ColorToken;
  tagColor: TagColor;
  tagLabel: string;
  to: string;
};

export default function CollectionCard({
  title,
  description,
  image,
  imageAlt,
  imageFit,
  colorB,
  tagColor,
  tagLabel,
  to,
}: CollectionCardProps) {
  return (
    <Card className="group flex flex-col">
      <Link to={to} className="block overflow-hidden bg-cream" tabIndex={-1}>
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className={`h-56 w-full transition-transform duration-500 group-hover:scale-[1.03] md:h-64 ${
            imageFit === "contain" ? "object-contain p-6" : "object-cover"
          }`}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <Tag color={tagColor} className="self-start">
          {tagLabel}
        </Tag>
        <h3 className="text-2xl font-bold">
          <em
            className="font-serif font-normal italic"
            style={{ color: COLOR_HEX[colorB] }}
          >
            {title}
          </em>
        </h3>
        <p className="text-sm leading-relaxed">{description}</p>
        <Link
          to={to}
          className="mt-auto font-mono text-xs font-medium uppercase tracking-widest underline decoration-1 underline-offset-4 transition-colors hover:text-pink"
        >
          Ver {title.toLowerCase()} ✦
        </Link>
      </div>
    </Card>
  );
}
