import { COLOR_HEX } from "../lib/colors";
import { cn } from "../lib/cn";
import type { ProductImage as ProductImageData } from "../types/product";

type ProductImageProps = {
  image: ProductImageData;
  alt: string;
  className?: string;
};

/** Placeholder de picsum.photos tintado con un color de la paleta
 *  (imagen en escala de grises + multiply sobre fondo de color). */
export default function ProductImage({
  image,
  alt,
  className,
}: ProductImageProps) {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ backgroundColor: COLOR_HEX[image.tint] }}
    >
      <img
        src={`https://picsum.photos/seed/${image.seed}/600/600`}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover opacity-80 grayscale mix-blend-multiply"
      />
    </div>
  );
}
