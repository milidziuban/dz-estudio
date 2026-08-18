import { useState } from "react";
import { COLOR_HEX, COLOR_LABEL, COLOR_TOKENS } from "../../lib/colors";
import { cn } from "../../lib/cn";
import { errorMessage, slugify } from "../../lib/admin";
import { uploadProductImage } from "../../lib/storage";
import type { ProductDraft } from "../../types/admin";
import type { ColorToken } from "../../types/product";
import SelectField from "../SelectField";
import TextField from "../TextField";
import TextareaField from "../TextareaField";
import Toggle from "./Toggle";

type ProductFormProps = {
  draft: ProductDraft;
  onChange: (draft: ProductDraft) => void;
};

/** Título de bloque dentro del formulario. */
function Bloque({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink/10 pt-5">
      <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function ProductForm({ draft, onChange }: ProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = <K extends keyof ProductDraft>(
    key: K,
    value: ProductDraft[K],
  ) => onChange({ ...draft, [key]: value });

  const toggleColor = (color: ColorToken) => {
    const colors = draft.colors.includes(color)
      ? draft.colors.filter((c) => c !== color)
      : [...draft.colors, color];
    set("colors", colors);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadProductImage(file);
      onChange({
        ...draft,
        images: [...draft.images, { src: url, fit: "cover" }],
      });
    } catch (error) {
      setUploadError(
        errorMessage(error, "No se pudo subir la foto"),
      );
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.images.length) return;
    const images = [...draft.images];
    [images[index], images[target]] = [images[target], images[index]];
    set("images", images);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <TextField
          id="p-name"
          label="Nombre"
          value={draft.name}
          onChange={(event) => {
            const name = event.target.value;
            // El slug se autocompleta solo en los productos nuevos: cambiarlo
            // en uno publicado rompería el link que ya está dando vueltas.
            onChange({
              ...draft,
              name,
              slug: draft.id === null ? slugify(name) : draft.slug,
            });
          }}
        />

        <TextField
          id="p-slug"
          label="Slug (URL)"
          value={draft.slug}
          onChange={(event) => set("slug", slugify(event.target.value))}
        />
        <p className="-mt-2 font-mono text-[10px] text-ink/45">
          /producto/{draft.slug || "…"}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="p-category"
            label="Categoría"
            value={draft.category}
            onChange={(event) =>
              set("category", event.target.value as ProductDraft["category"])
            }
          >
            <option value="almohadones">Almohadones</option>
            <option value="individuales">Individuales</option>
          </SelectField>

          <TextField
            id="p-price"
            label="Precio (ARS)"
            type="number"
            min={0}
            step={100}
            value={draft.price}
            onChange={(event) => set("price", Number(event.target.value) || 0)}
          />
        </div>
      </div>

      <Bloque title="Stock">
        <div className="space-y-4">
          <Toggle
            label="A la venta"
            hint="Si lo apagás, el producto sigue en la tienda pero no se puede comprar."
            checked={draft.inStock}
            onChange={(checked) => set("inStock", checked)}
          />

          <Toggle
            label="Controlar stock"
            hint="Con el control apagado se vende sin límite de unidades."
            checked={draft.stock !== null}
            onChange={(checked) => set("stock", checked ? 0 : null)}
          />

          {draft.stock !== null && (
            <TextField
              id="p-stock"
              label="Unidades disponibles"
              type="number"
              min={0}
              value={draft.stock}
              onChange={(event) => set("stock", Number(event.target.value) || 0)}
            />
          )}

          <TextField
            id="p-sku"
            label="SKU (opcional)"
            value={draft.sku}
            onChange={(event) => set("sku", event.target.value)}
          />
        </div>
      </Bloque>

      <Bloque title="Colores">
        <div className="flex flex-wrap gap-2">
          {COLOR_TOKENS.map((color) => {
            const selected = draft.colors.includes(color);
            return (
              <button
                key={color}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleColor(color)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors",
                  selected
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/20 text-ink/60 hover:border-ink",
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full border border-ink/20"
                  style={{ backgroundColor: COLOR_HEX[color] }}
                />
                {COLOR_LABEL[color]}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink/50">
          Son los colores por los que se filtra en la tienda. Dos por producto:
          nunca cinco.
        </p>
      </Bloque>

      <Bloque title="Ficha">
        <div className="space-y-4">
          <TextareaField
            id="p-description"
            label="Descripción"
            value={draft.description}
            onChange={(event) => set("description", event.target.value)}
          />
          <TextField
            id="p-medidas"
            label="Medidas"
            placeholder="40 x 40 cm (aprox.)"
            value={draft.medidas}
            onChange={(event) => set("medidas", event.target.value)}
          />
          <TextField
            id="p-peso"
            label="Peso"
            placeholder="350 g (aprox.)"
            value={draft.peso}
            onChange={(event) => set("peso", event.target.value)}
          />
          <TextField
            id="p-peso-gramos"
            label="Peso real (gramos)"
            type="number"
            min={0}
            step={10}
            placeholder="Sin cargar: se usa el default del panel"
            value={draft.pesoGramos ?? ""}
            onChange={(event) =>
              set(
                "pesoGramos",
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
          />
          <p className="-mt-2 text-[11px] leading-relaxed text-ink/50">
            Este es el que se usa para cotizar el envío — no lo que dice la
            ficha del producto.
          </p>
          <TextField
            id="p-material"
            label="Material"
            value={draft.material}
            onChange={(event) => set("material", event.target.value)}
          />
          <TextareaField
            id="p-cuidados"
            label="Cuidados"
            rows={3}
            value={draft.cuidados}
            onChange={(event) => set("cuidados", event.target.value)}
          />
        </div>
      </Bloque>

      <Bloque title="Fotos">
        {draft.images.length === 0 && (
          <p className="mb-4 text-[11px] text-ink/50">
            Sin fotos todavía. La primera es la que se ve en la grilla.
          </p>
        )}

        <ul className="space-y-3">
          {draft.images.map((image, index) => (
            <li key={index} className="rounded-xl bg-white p-3">
              <div className="flex gap-3">
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                  style={{
                    backgroundColor: COLOR_HEX[image.background ?? "cream"],
                  }}
                >
                  {image.src && (
                    <img
                      src={image.src}
                      alt=""
                      className={cn(
                        "h-full w-full",
                        image.fit === "contain"
                          ? "object-contain p-1"
                          : "object-cover",
                      )}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    aria-label={`Ruta o URL de la foto ${index + 1}`}
                    value={image.src}
                    onChange={(event) => {
                      const images = [...draft.images];
                      images[index] = { ...image, src: event.target.value };
                      set("images", images);
                    }}
                    placeholder="/productos/foto.webp"
                    className="w-full rounded-lg border border-ink/20 bg-transparent px-3 py-2 font-mono text-[11px] focus:border-ink focus:outline-none"
                  />

                  <div className="flex flex-wrap gap-2">
                    <select
                      aria-label={`Encuadre de la foto ${index + 1}`}
                      value={image.fit}
                      onChange={(event) => {
                        const images = [...draft.images];
                        images[index] = {
                          ...image,
                          fit: event.target.value as "cover" | "contain",
                        };
                        set("images", images);
                      }}
                      className="rounded-lg border border-ink/20 bg-transparent px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest focus:border-ink focus:outline-none"
                    >
                      <option value="cover">Ambientada (cover)</option>
                      <option value="contain">Recorte (contain)</option>
                    </select>

                    <select
                      aria-label={`Fondo de la foto ${index + 1}`}
                      value={image.background ?? "cream"}
                      onChange={(event) => {
                        const images = [...draft.images];
                        images[index] = {
                          ...image,
                          background: event.target.value as ColorToken,
                        };
                        set("images", images);
                      }}
                      className="rounded-lg border border-ink/20 bg-transparent px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest focus:border-ink focus:outline-none"
                    >
                      {COLOR_TOKENS.map((color) => (
                        <option key={color} value={color}>
                          Fondo {COLOR_LABEL[color]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-1">
                <button
                  type="button"
                  aria-label="Subir la foto en el orden"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/50 transition-colors hover:text-ink disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Bajar la foto en el orden"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === draft.images.length - 1}
                  className="rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/50 transition-colors hover:text-ink disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "images",
                      draft.images.filter((_, i) => i !== index),
                    )
                  }
                  className="rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-orange transition-opacity hover:opacity-70"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-full border border-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors hover:bg-ink hover:text-cream">
            {uploading ? "Subiendo…" : "Subir foto"}
            <input
              type="file"
              accept="image/webp,image/jpeg,image/png,image/avif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleUpload(file);
              }}
            />
          </label>

          <button
            type="button"
            onClick={() =>
              set("images", [...draft.images, { src: "", fit: "cover" }])
            }
            className="font-mono text-[10px] uppercase tracking-widest text-ink/55 transition-colors hover:text-ink"
          >
            + Agregar por ruta
          </button>
        </div>

        {uploadError && (
          <p role="alert" className="mt-3 text-xs font-semibold text-orange">
            ✕ {uploadError}
          </p>
        )}
      </Bloque>

      <Bloque title="Variantes">
        {draft.variants.length === 0 && (
          <p className="mb-4 text-[11px] leading-relaxed text-ink/50">
            Sin variantes: el producto se vende en una sola versión. Agregá una
            por cada color que el cliente pueda elegir.
          </p>
        )}

        <ul className="space-y-2">
          {draft.variants.map((variant, index) => (
            <li key={variant.id} className="flex flex-wrap items-center gap-2">
              <input
                aria-label={`Nombre de la variante ${index + 1}`}
                value={variant.label}
                onChange={(event) => {
                  const variants = [...draft.variants];
                  variants[index] = { ...variant, label: event.target.value };
                  set("variants", variants);
                }}
                placeholder="Celeste"
                className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
              <select
                aria-label={`Color de la variante ${index + 1}`}
                value={variant.color}
                onChange={(event) => {
                  const variants = [...draft.variants];
                  variants[index] = {
                    ...variant,
                    color: event.target.value as ColorToken,
                  };
                  set("variants", variants);
                }}
                className="rounded-lg border border-ink/20 bg-transparent px-2 py-2 font-mono text-[10px] uppercase tracking-widest focus:border-ink focus:outline-none"
              >
                {COLOR_TOKENS.map((color) => (
                  <option key={color} value={color}>
                    {COLOR_LABEL[color]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  set(
                    "variants",
                    draft.variants.filter((_, i) => i !== index),
                  )
                }
                className="font-mono text-[10px] uppercase tracking-widest text-orange transition-opacity hover:opacity-70"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() =>
            set("variants", [
              ...draft.variants,
              {
                // Los ids de Tienda Nube son numéricos; para las variantes
                // nuevas alcanza cualquier id estable.
                id: `v-${Date.now()}`,
                label: "",
                color: draft.colors[0] ?? "pink",
              },
            ])
          }
          className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink/55 transition-colors hover:text-ink"
        >
          + Agregar variante
        </button>
      </Bloque>
    </div>
  );
}
