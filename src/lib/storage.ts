import { supabase } from "./supabase";
import { slugify } from "./admin";

const BUCKET = "productos";

/** Extensiones que aceptamos: todo lo que los navegadores muestran bien. */
const ALLOWED = /\.(webp|jpe?g|png|avif)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Sube una foto al bucket público `productos` y devuelve su URL.
 *
 * El nombre se normaliza y se le agrega un timestamp: dos fotos con el mismo
 * nombre no se pisan, y la URL nueva no queda cacheada con la imagen vieja.
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED.test(file.name)) {
    throw new Error("Formato no soportado. Usá webp, jpg, png o avif.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La foto pesa más de 5 MB. Comprimila antes de subirla.");
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const base = slugify(file.name.slice(0, file.name.lastIndexOf("."))) || "foto";
  const path = `${base}-${Date.now()}${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
