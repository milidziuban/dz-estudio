import { supabase } from "./supabase";
import { slugify } from "./admin";

/** Extensiones que aceptamos: todo lo que los navegadores muestran bien. */
const ALLOWED = /\.(webp|jpe?g|png|avif)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Sube una foto a un bucket público y devuelve su URL.
 *
 * El nombre se normaliza y se le agrega un timestamp: dos fotos con el mismo
 * nombre no se pisan, y la URL nueva no queda cacheada con la imagen vieja.
 */
async function uploadImage(bucket: string, file: File): Promise<string> {
  if (!ALLOWED.test(file.name)) {
    throw new Error("Formato no soportado. Usá webp, jpg, png o avif.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La foto pesa más de 5 MB. Comprimila antes de subirla.");
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const base = slugify(file.name.slice(0, file.name.lastIndexOf("."))) || "foto";
  const path = `${base}-${Date.now()}${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Foto de ficha de producto. Bucket `productos`, la ve la tienda. */
export function uploadProductImage(file: File): Promise<string> {
  return uploadImage("productos", file);
}

/** Foto del calendario de contenido: la que todavía no se subió a Instagram.
 *  Va en su propio bucket para poder limpiar el mes cerrado sin tocar las
 *  fotos del catálogo. */
export function uploadContentImage(file: File): Promise<string> {
  return uploadImage("contenido", file);
}
