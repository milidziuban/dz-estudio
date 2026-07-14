import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import ProductImage from "../components/ProductImage";
import SelectField from "../components/SelectField";
import TextField from "../components/TextField";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import { cartSubtotal, resolveCartItems } from "../lib/cart";
import {
  BANK_INFO,
  checkoutSchema,
  PROVINCIAS,
  SHIPPING_OPTIONS,
  type CheckoutData,
} from "../lib/checkout";
import { cn } from "../lib/cn";
import { formatPrice } from "../lib/format";
import { supabase } from "../lib/supabase";

const STEPS = [
  { number: 1, label: "Contacto" },
  { number: 2, label: "Envío" },
  { number: 3, label: "Pago" },
];

const STEP_FIELDS: Record<number, (keyof CheckoutData)[]> = {
  1: ["email", "telefono", "nombre", "apellido"],
  2: ["direccion", "ciudad", "provincia", "cp", "envio"],
};

export default function Checkout() {
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const { data: products = [], isLoading } = useProducts();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { pago: "mp", provincia: "" },
    mode: "onTouched",
  });

  const resolved = resolveCartItems(items, products);
  const subtotal = cartSubtotal(resolved);
  const envioSel = watch("envio");
  const pagoSel = watch("pago");
  const shippingCost = SHIPPING_OPTIONS.find((o) => o.id === envioSel)?.cost;
  const total = subtotal + (shippingCost ?? 0);

  if (isLoading) {
    return (
      <p
        className="animate-pulse px-5 py-24 text-center font-mono text-sm uppercase tracking-widest"
        role="status"
      >
        ✦ Cargando…
      </p>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className="px-5 py-24 text-center">
        <p className="font-serif text-3xl italic">
          No hay nada para pagar todavía ✧
        </p>
        <p className="mt-3">
          Tu carrito está más vacío que mesa de soltero. ¿Empezamos?
        </p>
        <Button to="/tienda" className="mt-8">
          Ver la tienda ✦
        </Button>
      </div>
    );
  }

  const goToStep = async (target: number) => {
    if (target <= step) {
      setStep(target);
      return;
    }
    const fields = STEP_FIELDS[step];
    const valid = fields ? await trigger(fields) : true;
    if (valid) setStep(target);
  };

  const onSubmit = async (data: CheckoutData) => {
    setSubmitError(null);

    // id generado en el cliente: la anon key puede insertar órdenes
    // pero no leerlas (RLS), así que no podemos pedir el id de vuelta
    const orderId = crypto.randomUUID();
    const orderItems = resolved.map(({ product, qty }) => ({
      slug: product.slug,
      name: product.name,
      price: product.price,
      qty,
    }));

    const { error } = await supabase.from("orders").insert({
      id: orderId,
      customer_email: data.email,
      customer_name: `${data.nombre} ${data.apellido}`,
      customer_phone: data.telefono,
      shipping_address: {
        direccion: data.direccion,
        ciudad: data.ciudad,
        provincia: data.provincia,
        cp: data.cp,
      },
      shipping_method: data.envio,
      items: orderItems,
      subtotal,
      shipping_cost: shippingCost ?? 0,
      total,
      payment_method: data.pago,
      status: "pending",
    });

    if (error) {
      setSubmitError(
        "No pudimos guardar el pedido. Reintentá en un momento — tus datos siguen acá.",
      );
      return;
    }

    const orderNumber = orderId.slice(0, 8).toUpperCase();

    // Mercado Pago: creamos la preferencia en el servidor y redirigimos.
    // No vaciamos el carrito acá por si el pago se rechaza o se abandona;
    // se limpia al volver con pago aprobado.
    if (data.pago === "mp") {
      const { data: pref, error: fnError } = await supabase.functions.invoke(
        "create-preference",
        { body: { orderId } },
      );

      if (fnError || !pref?.init_point) {
        setSubmitError(
          "No pudimos conectar con Mercado Pago. Probá de nuevo o elegí transferencia.",
        );
        return;
      }

      window.location.href = pref.init_point as string;
      return;
    }

    // Transferencia: no hay pasarela, confirmamos directo.
    clearCart();
    navigate("/checkout/exito", {
      state: {
        orderNumber,
        nombre: data.nombre,
        email: data.email,
        pago: data.pago,
        total,
      },
    });
  };

  const fieldset = "rounded-[14px] border-[2.5px] border-ink bg-cream p-6 shadow-hard-lg sm:p-8";
  const legend = "mb-6 flex items-center gap-3 text-2xl font-extrabold";

  return (
    <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✦ Checkout
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ya casi es{" "}
          <em className="font-serif font-normal italic text-pink">tuyo</em>
        </h1>

        {/* Indicador de pasos */}
        <ol className="mt-8 flex gap-2 sm:gap-4" aria-label="Pasos del checkout">
          {STEPS.map((s) => (
            <li key={s.number}>
              <button
                type="button"
                onClick={() => goToStep(s.number)}
                aria-current={step === s.number ? "step" : undefined}
                className="flex items-center gap-2"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink font-mono text-sm font-medium",
                    step === s.number && "bg-ink text-cream",
                    step > s.number && "bg-verde",
                    step < s.number && "bg-cream",
                  )}
                >
                  {step > s.number ? "✓" : s.number}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs uppercase tracking-widest",
                    step === s.number ? "font-medium" : "text-ink/60",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Paso 1 — Contacto */}
            {step === 1 && (
              <fieldset className={fieldset}>
                <legend className="sr-only">Contacto</legend>
                <p className={legend}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-amarillo font-mono text-sm">
                    1
                  </span>
                  Contacto
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Email"
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    error={errors.email?.message}
                    className="sm:col-span-2"
                    {...register("email")}
                  />
                  <TextField
                    label="Teléfono"
                    id="telefono"
                    type="tel"
                    placeholder="11 5555 5555"
                    error={errors.telefono?.message}
                    className="sm:col-span-2"
                    {...register("telefono")}
                  />
                  <TextField
                    label="Nombre"
                    id="nombre"
                    error={errors.nombre?.message}
                    {...register("nombre")}
                  />
                  <TextField
                    label="Apellido"
                    id="apellido"
                    error={errors.apellido?.message}
                    {...register("apellido")}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="mt-8"
                >
                  Continuar ✦
                </Button>
              </fieldset>
            )}

            {/* Paso 2 — Envío */}
            {step === 2 && (
              <fieldset className={fieldset}>
                <legend className="sr-only">Envío</legend>
                <p className={legend}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-amarillo font-mono text-sm">
                    2
                  </span>
                  Envío
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Dirección"
                    id="direccion"
                    placeholder="Calle y número, piso, depto"
                    error={errors.direccion?.message}
                    className="sm:col-span-2"
                    {...register("direccion")}
                  />
                  <TextField
                    label="Ciudad"
                    id="ciudad"
                    error={errors.ciudad?.message}
                    {...register("ciudad")}
                  />
                  <SelectField
                    label="Provincia"
                    id="provincia"
                    error={errors.provincia?.message}
                    {...register("provincia")}
                  >
                    <option value="">Elegí una provincia…</option>
                    {PROVINCIAS.map((provincia) => (
                      <option key={provincia} value={provincia}>
                        {provincia}
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    label="Código postal"
                    id="cp"
                    error={errors.cp?.message}
                    {...register("cp")}
                  />
                </div>

                <p className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-widest">
                  ✧ ¿Cómo lo recibís?
                </p>
                <div className="space-y-3">
                  {SHIPPING_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-[14px] border-2 border-ink bg-cream p-4 transition-all has-[:checked]:bg-amarillo has-[:checked]:shadow-hard"
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          value={option.id}
                          className="h-4 w-4 accent-ink"
                          {...register("envio")}
                        />
                        <span>
                          <span className="block text-sm font-bold">
                            {option.label}
                          </span>
                          <span className="block text-xs text-ink/70">
                            {option.detail}
                          </span>
                        </span>
                      </span>
                      <span className="font-mono text-sm font-medium tracking-wider">
                        {option.cost === 0 ? "Gratis" : formatPrice(option.cost)}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.envio && (
                  <p className="mt-2 text-xs font-semibold text-orange">
                    ✕ {errors.envio.message}
                  </p>
                )}

                <div className="mt-8 flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                  >
                    ← Volver
                  </Button>
                  <Button type="button" onClick={() => goToStep(3)}>
                    Continuar ✦
                  </Button>
                </div>
              </fieldset>
            )}

            {/* Paso 3 — Pago */}
            {step === 3 && (
              <fieldset className={fieldset}>
                <legend className="sr-only">Pago</legend>
                <p className={legend}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-amarillo font-mono text-sm">
                    3
                  </span>
                  Pago
                </p>

                <input type="hidden" {...register("pago")} />

                <div role="tablist" aria-label="Método de pago" className="flex gap-2">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={pagoSel === "mp"}
                    onClick={() => setValue("pago", "mp")}
                    className={cn(
                      "rounded-full border-2 border-ink px-5 py-2 font-mono text-xs font-medium uppercase tracking-widest",
                      pagoSel === "mp" ? "bg-ink text-cream" : "bg-cream",
                    )}
                  >
                    Mercado Pago
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={pagoSel === "transferencia"}
                    onClick={() => setValue("pago", "transferencia")}
                    className={cn(
                      "rounded-full border-2 border-ink px-5 py-2 font-mono text-xs font-medium uppercase tracking-widest",
                      pagoSel === "transferencia" ? "bg-ink text-cream" : "bg-cream",
                    )}
                  >
                    Transferencia
                  </button>
                </div>

                {pagoSel === "mp" ? (
                  <div className="mt-6 rounded-[14px] border-2 border-ink bg-celeste p-6">
                    <p className="text-sm leading-relaxed">
                      Te llevamos a Mercado Pago para pagar con tarjeta de
                      crédito, débito o efectivo. Volvés acá con todo resuelto.
                    </p>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-6 w-full py-4 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSubmitting
                        ? "Guardando pedido…"
                        : "Pagar con Mercado Pago ✦"}
                    </Button>
                    <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-ink/60">
                      Demo — el redirect real a MP llega con la Edge Function
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[14px] border-2 border-ink bg-lila p-6">
                    <p className="text-sm leading-relaxed">
                      Transferí el total y mandanos el comprobante por WhatsApp.
                      Te reservamos el pedido por 48 horas.
                    </p>
                    <dl className="mt-4 space-y-1.5 font-mono text-xs tracking-wider">
                      <div className="flex justify-between gap-4">
                        <dt className="uppercase text-ink/70">Banco</dt>
                        <dd>{BANK_INFO.banco}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="uppercase text-ink/70">Titular</dt>
                        <dd>{BANK_INFO.titular}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="uppercase text-ink/70">CUIT</dt>
                        <dd>{BANK_INFO.cuit}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="uppercase text-ink/70">CBU</dt>
                        <dd className="break-all">{BANK_INFO.cbu}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="uppercase text-ink/70">Alias</dt>
                        <dd>{BANK_INFO.alias}</dd>
                      </div>
                    </dl>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-6 w-full py-4 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSubmitting ? "Guardando pedido…" : "Confirmar pedido ✦"}
                    </Button>
                  </div>
                )}

                {submitError && (
                  <p
                    className="mt-4 rounded-lg border-2 border-ink bg-orange p-3 text-sm font-semibold text-cream"
                    role="alert"
                  >
                    ✕ {submitError}
                  </p>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="mt-6"
                >
                  ← Volver
                </Button>
              </fieldset>
            )}
          </form>

          {/* Resumen del pedido */}
          <aside className="lg:sticky lg:top-28">
            <Card className="p-6">
              <h2 className="font-mono text-sm font-medium uppercase tracking-widest">
                ✦ Tu pedido
              </h2>
              <ul className="mt-4 space-y-3">
                {resolved.map(({ product, qty }) => (
                  <li key={product.slug} className="flex items-center gap-3">
                    <ProductImage
                      image={product.images[0]}
                      alt=""
                      className="aspect-square w-12 shrink-0 rounded-lg border-2 border-ink"
                    />
                    <span className="flex-1 text-xs font-bold leading-snug">
                      {product.name}
                      <span className="block font-mono font-normal text-ink/60">
                        x{qty}
                      </span>
                    </span>
                    <span className="font-mono text-xs tracking-wider">
                      {formatPrice(product.price * qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-1.5 border-t-2 border-ink pt-4 font-mono text-sm tracking-wider">
                <div className="flex justify-between">
                  <dt className="text-xs uppercase">Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs uppercase">Envío</dt>
                  <dd>
                    {shippingCost === undefined
                      ? "A definir"
                      : shippingCost === 0
                        ? "Gratis"
                        : formatPrice(shippingCost)}
                  </dd>
                </div>
                <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-medium">
                  <dt className="uppercase">Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
