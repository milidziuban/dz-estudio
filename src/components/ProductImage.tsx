import { COLOR_HEX } from "../lib/colors";
import { cn } from "../lib/cn";
import type { ProductImage as ProductImageData } from "../types/product";

type ProductImageProps = {
  image: ProductImageData;
  alt: string;
  className?: string;
};

/** Foto real del catálogo. Los recortes sobre fondo blanco van en `contain`
 *  con un color de la paleta detrás; las fotos ambientadas van en `cover`. */
export default function ProductImage({
  image,
  alt,
  className,
}: ProductImageProps) {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        backgroundColor: COLOR_HEX[image.background ?? "cream"],
      }}
    >
      <img
        src={image.src}
        alt={alt}
        loading="lazy"
        className={cn(
          "h-full w-full",
          image.fit === "contain" ? "object-contain p-4" : "object-cover",
        )}
      />
    </div>
  );
}
