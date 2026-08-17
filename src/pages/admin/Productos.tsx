import { useMemo, useState } from "react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import ProductForm from "../../components/admin/ProductForm";
import QueryError from "../../components/admin/QueryError";
import Button from "../../components/Button";
import {
  draftFromProduct,
  emptyDraft,
  useAdminProducts,
  useDeleteProduct,
  useQuickUpdateProduct,
  useSaveProduct,
} from "../../hooks/useAdminProducts";
import { useStoreSettings } from "../../hooks/useStoreSettings";
import { cn } from "../../lib/cn";
import { COLOR_HEX } from "../../lib/colors";
import { formatPrice } from "../../lib/format";
import type { AdminProduct, ProductDraft } from "../../types/admin";

type Filtro = "todos" | "almohadones" | "individuales";

/** Celda de stock editable en el listado: el caso más frecuente es corregir
 *  un número, no abrir la ficha completa. */
function StockCell({ product }: { product: AdminProduct }) {
  const quickUpdate = useQuickUpdateProduct();
  const [value, setValue] = useState<string>(
    product.stock === null ? "" : String(product.stock),
  );

  if (product.stock === null) {
    return <span className="font-mono text-xs text-ink/40">Sin control</span>;
  }

  const commit = () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setValue(String(product.stock));
      return;
    }
    if (parsed === product.stock) return;
    quickUpdate.mutate({ id: product.id, patch: { stock: parsed } });
  };

  return (
    <input
      type="number"
      min={0}
      aria-label={`Stock de ${product.name}`}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={cn(
        "w-16 rounded-lg border bg-transparent px-2 py-1 text-right font-mono text-xs focus:border-ink focus:outline-none",
        quickUpdate.isPending ? "border-celeste" : "border-ink/20",
      )}
    />
  );
}

export default function AdminProductos() {
  const products = useAdminProducts();
  const saveProduct = useSaveProduct();
  const deleteProduct = useDeleteProduct();
  const quickUpdate = useQuickUpdateProduct();
  const { data: settings } = useStoreSettings();

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const lowStock = settings?.distribucion.lowStockThreshold ?? 3;

  const visibles = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return (products.data ?? []).filter((product) => {
      if (filtro !== "todos" && product.category !== filtro) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        product.slug.includes(term) ||
        (product.sku ?? "").toLowerCase().includes(term)
      );
    });
  }, [products.data, busqueda, filtro]);

  const guardar = async () => {
    if (!draft) return;
    setFormError(null);

    if (!draft.name.trim()) {
      setFormError("Falta el nombre del producto");
      return;
    }
    if (!draft.slug.trim()) {
      setFormError("Falta el slug (la URL del producto)");
      return;
    }
    if (draft.price <= 0) {
      setFormError("El precio tiene que ser mayor a cero");
      return;
    }

    try {
      await saveProduct.mutateAsync(draft);
      setDraft(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No se pudo guardar",
      );
    }
  };

  const borrar = async (product: AdminProduct) => {
    const ok = window.confirm(
      `¿Borrar "${product.name}"? Se va de la tienda. Las órdenes que ya lo incluyen no se tocan.`,
    );
    if (!ok) return;
    await deleteProduct.mutateAsync(product.id);
  };

  if (products.error) {
    return (
      <>
        <PageHeading title="Productos" />
        <QueryError error={products.error} what="el catálogo" />
      </>
    );
  }

  return (
    <>
      <PageHeading
        title={
          <>
            Productos{" "}
            <em className="font-serif font-normal italic text-pink">
              del catálogo
            </em>
          </>
        }
        description="Precios, stock y fichas. Lo que guardás acá es lo que ve la tienda."
      >
        <Button
          className="px-6 py-3"
          onClick={() => {
            setFormError(null);
            setDraft(emptyDraft());
          }}
        >
          + Nuevo producto
        </Button>
      </PageHeading>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por nombre, slug o SKU"
          aria-label="Buscar productos"
          className="w-full rounded-full border border-ink/20 bg-white px-5 py-2.5 font-mono text-xs focus:border-ink focus:outline-none sm:max-w-xs"
        />

        <div
          role="group"
          aria-label="Filtrar por categoría"
          className="flex gap-1 rounded-full bg-white p-1"
        >
          {(
            [
              ["todos", "Todos"],
              ["almohadones", "Almohadones"],
              ["individuales", "Individuales"],
            ] as [Filtro, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filtro === id}
              onClick={() => setFiltro(id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-widest transition-colors",
                filtro === id ? "bg-ink text-cream" : "text-ink/55 hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45 sm:ml-auto">
          {visibles.length} {visibles.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      <AdminTable
        columns={[
          { label: "Producto" },
          { label: "Categoría", hideOnMobile: true },
          { label: "Precio", align: "right" },
          { label: "Stock", align: "right" },
          { label: "A la venta", align: "center" },
          { label: "", align: "right" },
        ]}
        isLoading={products.isLoading}
        isEmpty={visibles.length === 0}
        empty={
          busqueda || filtro !== "todos"
            ? "Ningún producto coincide con esa búsqueda."
            : "El catálogo está vacío. Cargá el primer producto."
        }
      >
        {visibles.map((product) => (
          <tr
            key={product.id}
            className="border-b border-ink/[0.06] last:border-0"
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                  style={{
                    backgroundColor:
                      COLOR_HEX[product.images[0]?.background ?? "cream"],
                  }}
                >
                  {product.images[0]?.src && (
                    <img
                      src={product.images[0].src}
                      alt=""
                      loading="lazy"
                      className={cn(
                        "h-full w-full",
                        product.images[0].fit === "contain"
                          ? "object-contain p-1"
                          : "object-cover",
                      )}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setDraft(draftFromProduct(product));
                    }}
                    className="block max-w-[16rem] truncate text-left text-sm font-semibold hover:text-pink"
                  >
                    {product.name}
                  </button>
                  <span className="font-mono text-[10px] text-ink/40">
                    {product.sku ? `${product.sku} · ` : ""}
                    {product.slug}
                  </span>
                </div>
              </div>
            </td>

            <td className="hidden px-4 py-3 sm:table-cell">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">
                {product.category}
              </span>
            </td>

            <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
              {formatPrice(product.price)}
            </td>

            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                <StockCell product={product} />
                {product.stock !== null && product.stock <= lowStock && (
                  <span
                    title="Poco stock"
                    className="font-mono text-[10px] uppercase tracking-widest text-orange"
                  >
                    bajo
                  </span>
                )}
              </div>
            </td>

            <td className="px-4 py-3 text-center">
              <button
                type="button"
                role="switch"
                aria-checked={product.inStock}
                aria-label={`${product.name} a la venta`}
                onClick={() =>
                  quickUpdate.mutate({
                    id: product.id,
                    patch: { inStock: !product.inStock },
                  })
                }
                className={cn(
                  "relative inline-block h-5 w-9 rounded-full transition-colors",
                  product.inStock ? "bg-verde" : "bg-ink/20",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1 h-3 w-3 rounded-full bg-white transition-transform",
                    product.inStock ? "translate-x-5" : "translate-x-1",
                  )}
                />
              </button>
            </td>

            <td className="whitespace-nowrap px-4 py-3 text-right">
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setDraft(draftFromProduct(product));
                }}
                className="font-mono text-[10px] uppercase tracking-widest text-ink/55 transition-colors hover:text-ink"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => void borrar(product)}
                className="ml-3 font-mono text-[10px] uppercase tracking-widest text-orange/70 transition-colors hover:text-orange"
              >
                Borrar
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminDrawer
        open={draft !== null}
        onClose={() => setDraft(null)}
        wide
        title={draft?.id === null ? "Nuevo producto" : "Editar producto"}
        subtitle={
          draft?.id === null
            ? "Se publica en la tienda apenas lo guardás."
            : draft?.slug
        }
        footer={
          <div className="space-y-3">
            {formError && (
              <p role="alert" className="text-xs font-semibold text-orange">
                ✕ {formError}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                className="flex-1 disabled:opacity-50"
                disabled={saveProduct.isPending}
                onClick={() => void guardar()}
              >
                {saveProduct.isPending ? "Guardando…" : "Guardar ✦"}
              </Button>
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        }
      >
        {draft && <ProductForm draft={draft} onChange={setDraft} />}
      </AdminDrawer>
    </>
  );
}
