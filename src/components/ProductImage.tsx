import { COLOR_HEX } from "../lib/colors";
import { cn } from "../lib/cn";
import type { ProductImage as ProductImageData } from "../types/product";

type ProductImageProps = {
  image: ProductImageData;
  alt: string;
  className?: string;
  /** La foto principal de la ficha: carga sin esperar y con prioridad alta,
   *  porque es la que mide Google como LCP. El resto queda en `lazy`. */
  priority?: boolean;
};

/** Foto real del catálogo. Los recortes sobre fondo blanco van en `contain`
 *  con un color de la paleta detrás; las fotos ambientadas van en `cover`.
 *
 *  No lleva `width`/`height`: quien la usa la mete siempre en un contenedor
 *  con relación de aspecto fija (`aspect-square`) o dentro de uno posicionado,
 *  así que el espacio ya queda reservado antes de que la foto llegue. */
export default function ProductImage({
  image,
  alt,
  className,
  priority = false,
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
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn(
          "h-full w-full",
          image.fit === "contain" ? "object-contain p-4" : "object-cover",
        )}
      />
    </div>
  );
}
