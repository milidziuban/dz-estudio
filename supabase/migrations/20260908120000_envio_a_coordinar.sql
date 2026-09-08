-- ============================================================
-- Envío a coordinar — 08/09/2026
--
-- Hasta tener las tarifas reales de Andreani y del Correo, la tienda no
-- cotiza envíos: la clienta elige retiro o "Envío a coordinar", paga solo los
-- productos, y el costo del envío se le pasa por WhatsApp y se cobra aparte.
--
-- Esta migración hace las dos cosas que el código solo no puede:
--
-- 1. El CHECK de `orders.shipping_method` solo aceptaba los cinco métodos
--    viejos. Sin esto, **cada pedido con el método nuevo lo rechaza la base**
--    y la compra falla entera.
-- 2. `recalculate_order_totals` reparte por modo y no conocía "a-coordinar".
--    Habría caído en la rama de "vivo", que toma el shipping_cost que mandó el
--    cliente y solo lo acota: un pedido armado a mano podía sumarse un envío
--    que nadie cotizó. Ahora es cero explícito.
--
-- Las cuatro opciones de las transportistas no se borran: quedan apagadas y
-- se prenden desde /admin cuando estén los números reales.
-- ============================================================

alter table public.orders
  drop constraint if exists orders_shipping_method_check;

alter table public.orders
  add constraint orders_shipping_method_check
  check (shipping_method = any (array[
    'retiro',
    'envio-a-coordinar',
    'andreani-sucursal',
    'andreani-domicilio',
    'correo-sucursal',
    'correo-domicilio'
  ]));

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
        {"id":"envio-a-coordinar","mode":"a-coordinar","cost":0,"enabled":true},
        {"id":"andreani-sucursal","mode":"fijo","cost":7200,"enabled":false},
        {"id":"andreani-domicilio","mode":"fijo","cost":9500,"enabled":false},
        {"id":"correo-sucursal","mode":"vivo","cost":6500,"enabled":false,"provider":"correo-argentino","service":"sucursal"},
        {"id":"correo-domicilio","mode":"vivo","cost":8500,"enabled":false,"provider":"correo-argentino","service":"domicilio"}
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
  elsif coalesce(v_option ->> 'mode', 'fijo') = 'a-coordinar' then
    -- El envío no se cobra en la tienda: se coordina y se cobra aparte. Cero
    -- explícito, no por la rama de abajo: si cayera en la de "vivo" tomaría el
    -- shipping_cost que mandó el cliente y lo daría por bueno.
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
