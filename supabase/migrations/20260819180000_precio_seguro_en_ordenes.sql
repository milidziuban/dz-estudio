-- ============================================================
-- DZ Estudio — Precio seguro en órdenes (19/08/2026)
--
-- Hallazgo de seguridad: el checkout calculaba subtotal/descuento/envío/
-- total en el navegador y los mandaba tal cual al insert de `orders`
-- (la policy de INSERT es `with check (true)`, no valida montos). La
-- Edge Function `create-preference` tomaba esos valores como "fuente de
-- verdad" para cobrar por Mercado Pago — cualquiera podía, desde la
-- consola del navegador, insertar un pedido con el precio que quisiera y
-- pagarlo por ese monto.
--
-- Esta migración agrega un trigger `before insert` que recalcula, del
-- lado del servidor y a partir de `products`/`store_settings`, todo lo
-- que antes se confiaba del cliente:
--   · items[].price y subtotal → precio real de `products`, ignora lo
--     que mande el navegador en `items[].price`.
--   · discount/discount_label → misma lógica que `bestDiscount()` en
--     src/lib/promos.ts (combo de almohadones vs. transferencia).
--   · shipping_cost → para envío de costo fijo, se fuerza el valor
--     configurado en el panel (sin margen para el cliente). Para
--     Correo Argentino (cotización en vivo) esto solo acota el rango;
--     el monto exacto lo vuelve a corregir `create-preference` contra la
--     cotización real antes de cobrar por Mercado Pago.
--   · total = subtotal - discount + shipping_cost.
--
-- Si `items` referencia un slug inexistente, una cantidad inválida, o un
-- método de envío deshabilitado, el insert falla — antes se guardaba
-- igual.
--
-- Pegar completo en Supabase → SQL Editor → Run. Idempotente (create or
-- replace / drop trigger if exists).
-- ============================================================

create or replace function public.recalculate_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Debe coincidir con COMBO_CATEGORIES en src/lib/promos.ts
  v_combo_categories text[] := array['almohadones'];

  v_item jsonb;
  v_product record;
  v_items jsonb := '[]'::jsonb;
  v_item_qty integer;
  v_item_total integer;
  v_subtotal integer := 0;
  v_item_count integer := 0;

  v_combo_qty integer := 0;
  v_combo_base integer := 0;
  v_combo_discount integer := 0;
  v_transfer_discount integer := 0;
  v_discount integer := 0;
  v_discount_label text;

  v_promos jsonb;
  v_combo_enabled boolean;
  v_combo_percent numeric;
  v_combo_min_qty integer;
  v_transfer_enabled boolean;
  v_transfer_percent numeric;

  v_envios jsonb;
  v_option jsonb;
  v_free_from integer;
  v_shipping_cost integer;
  v_max_configured_cost integer;
begin
  -- 1. Items y subtotal: precio real de `products`, nunca el del cliente.
  for v_item in select * from jsonb_array_elements(new.items)
  loop
    select id, slug, name, category, price into v_product
      from public.products
     where slug = v_item->>'slug';

    if not found then
      raise exception 'Producto inválido en el pedido: %', coalesce(v_item->>'slug', '(sin slug)');
    end if;

    v_item_qty := nullif(v_item->>'qty', '')::integer;
    if v_item_qty is null or v_item_qty <= 0 or v_item_qty > 50 then
      raise exception 'Cantidad inválida para %: %', v_product.slug, v_item->>'qty';
    end if;

    v_item_total := v_product.price * v_item_qty;
    v_subtotal := v_subtotal + v_item_total;
    v_item_count := v_item_count + 1;

    if v_product.category = any(v_combo_categories) then
      v_combo_qty := v_combo_qty + v_item_qty;
      v_combo_base := v_combo_base + v_item_total;
    end if;

    v_items := v_items || jsonb_build_object(
      'slug', v_product.slug,
      'name', v_product.name,
      'variant', v_item->>'variant',
      'variant_id', v_item->>'variant_id',
      'price', v_product.price,
      'qty', v_item_qty
    );
  end loop;

  if v_item_count = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  new.items := v_items;
  new.subtotal := v_subtotal;

  -- 2. Descuentos — misma regla que bestDiscount() en src/lib/promos.ts:
  --    la promo combo y la de transferencia no se combinan, gana la mayor.
  select value into v_promos from public.store_settings where key = 'marketing';
  v_promos := coalesce(v_promos -> 'promos', '{}'::jsonb);

  v_combo_enabled := coalesce((v_promos -> 'combo' ->> 'enabled')::boolean, true);
  v_combo_percent := coalesce((v_promos -> 'combo' ->> 'percent')::numeric, 10);
  v_combo_min_qty := coalesce((v_promos -> 'combo' ->> 'minQty')::integer, 2);
  v_transfer_enabled := coalesce((v_promos -> 'transferencia' ->> 'enabled')::boolean, true);
  v_transfer_percent := coalesce((v_promos -> 'transferencia' ->> 'percent')::numeric, 10);

  if v_combo_enabled and v_combo_qty >= v_combo_min_qty then
    v_combo_discount := round(v_combo_base * (v_combo_percent / 100));
  end if;

  -- El descuento por transferencia solo es honesto si el pedido efectivamente
  -- se paga por transferencia — no se calcula para pedidos de Mercado Pago.
  if v_transfer_enabled and new.payment_method = 'transferencia' and v_subtotal > 0 then
    v_transfer_discount := round(v_subtotal * (v_transfer_percent / 100));
  end if;

  if v_combo_discount = 0 and v_transfer_discount = 0 then
    v_discount := 0;
    v_discount_label := null;
  elsif v_combo_discount >= v_transfer_discount then
    v_discount := v_combo_discount;
    v_discount_label := format('%s%% llevando %s o más almohadones', v_combo_percent::integer, v_combo_min_qty);
  else
    v_discount := v_transfer_discount;
    v_discount_label := format('%s%% pagando por transferencia', v_transfer_percent::integer);
  end if;

  new.discount := v_discount;
  new.discount_label := v_discount_label;

  -- 3. Envío. Si todavía no se guardó nada desde /admin, se usan los mismos
  --    valores de fábrica que SHIPPING_OPTIONS en src/lib/checkout.ts.
  select value into v_envios from public.store_settings where key = 'envios';
  if v_envios is null then
    v_envios := '{
      "freeShippingFrom": null,
      "options": [
        {"id":"retiro","mode":"fijo","cost":0,"enabled":true},
        {"id":"andreani-sucursal","mode":"fijo","cost":7200,"enabled":true},
        {"id":"andreani-domicilio","mode":"fijo","cost":9500,"enabled":true},
        {"id":"correo-sucursal","mode":"vivo","cost":6500,"enabled":true,"provider":"correo-argentino","service":"sucursal"},
        {"id":"correo-domicilio","mode":"vivo","cost":8500,"enabled":true,"provider":"correo-argentino","service":"domicilio"}
      ]
    }'::jsonb;
  end if;

  select o into v_option
    from jsonb_array_elements(coalesce(v_envios -> 'options', '[]'::jsonb)) o
   where o ->> 'id' = new.shipping_method
   limit 1;

  if v_option is null or coalesce((v_option ->> 'enabled')::boolean, true) = false then
    raise exception 'Método de envío inválido o deshabilitado: %', new.shipping_method;
  end if;

  v_free_from := nullif(v_envios ->> 'freeShippingFrom', '')::integer;

  if v_free_from is not null and v_subtotal >= v_free_from then
    v_shipping_cost := 0;
  elsif coalesce(v_option ->> 'mode', 'fijo') = 'fijo' then
    -- Costo fijo: se fuerza el valor del panel, el cliente no puede alterarlo.
    v_shipping_cost := coalesce((v_option ->> 'cost')::integer, 0);
  else
    -- Cotización en vivo (Correo Argentino): acá solo se acota a un rango
    -- razonable como resguardo. El monto exacto lo corrige la Edge Function
    -- create-preference contra la cotización real antes de cobrar por MP.
    select coalesce(max((o ->> 'cost')::integer), 0) * 2
      into v_max_configured_cost
      from jsonb_array_elements(coalesce(v_envios -> 'options', '[]'::jsonb)) o;

    v_shipping_cost := greatest(0, least(coalesce(new.shipping_cost, 0), greatest(v_max_configured_cost, 1)));
  end if;

  new.shipping_cost := v_shipping_cost;
  new.total := v_subtotal - v_discount + v_shipping_cost;

  return new;
end;
$$;

revoke all on function public.recalculate_order_totals() from public;

drop trigger if exists orders_recalculate_totals on public.orders;

create trigger orders_recalculate_totals
  before insert on public.orders
  for each row execute function public.recalculate_order_totals();
