-- ============================================================
-- El cupón se canjea en el checkout (M3) — 11/09/2026
--
-- Los cupones de /admin/descuentos se creaban pero nadie podía usarlos: el
-- checkout no tenía dónde escribirlos. Ahora el código viaja en la orden
-- (`coupon_code`) y la base decide, como con todo lo demás del precio: el
-- trigger lo valida con la misma función que usa la tienda para mostrarlo
-- (`cupon_vigente`, R18), exige el mínimo y calcula el descuento según
-- `kind`. Lo que el navegador manda en `discount` y `total` se sigue
-- ignorando.
--
-- Tres reglas, decididas el 11/09 (ver Decisiones en el vault):
--
-- · El cupón no se suma a las promos automáticas (10% por transferencia,
--   10% llevando 2): se aplica el descuento mayor, igual que entre las dos
--   promos. Empate: gana el cupón, que es lo que la clienta escribió y
--   espera ver en el resumen. Si la promo da más, el cupón queda sin usar y
--   la orden se guarda sin él.
-- · El uso (`uses + 1`) se cuenta cuando la orden se paga de verdad —el
--   webhook de Mercado Pago o Mili confirmando la transferencia—, no al
--   insertar: un pedido de MP abandonado no gasta el cupón. `coupon_counted`
--   evita contar dos veces si el estado va y vuelve, igual que
--   `stock_descontado`.
-- · `free-shipping` no descuenta plata en la tienda, porque hoy el envío no
--   se cobra acá: deja la orden marcada (`coupon_kind`) para que el panel,
--   el remito y el mail digan "envío sin cargo" en vez de "falta cobrar el
--   envío". Si algún día se cobra envío fijo en la tienda, lo pone en cero.
--   Corre en paralelo a las promos: no compite con ellas porque no toca el
--   precio de los productos.
--
-- Un cupón inválido o por debajo del mínimo rechaza la orden con `hint`
-- (`cupon-invalido`, `cupon-minimo`) y `detail` en JSON, como el aviso de
-- stock: el texto lo escribe src/pages/Checkout.tsx.
-- ============================================================

alter table public.orders
  add column if not exists coupon_code text,
  add column if not exists coupon_kind text
    check (coupon_kind in ('percent', 'fixed', 'free-shipping')),
  add column if not exists coupon_counted boolean not null default false;

comment on column public.orders.coupon_code is
  'Código del cupón aplicado, ya validado por recalculate_order_totals. Null si no hubo cupón o si la promo automática dio más.';
comment on column public.orders.coupon_kind is
  'kind del cupón al momento de la compra. free-shipping marca que el envío no se cobra.';
comment on column public.orders.coupon_counted is
  'El uso del cupón ya se sumó en discounts.uses (pasa al cobrarse la orden).';

-- El seguimiento público del pedido también tiene que saber que el envío es
-- sin cargo, o le dice a la clienta que se lo van a cobrar aparte. La función
-- cambia de forma, así que se recrea.
drop function if exists public.get_order_tracking(text, text);

create function public.get_order_tracking(
  p_order_code text,
  p_email text
)
returns table (
  id uuid,
  created_at timestamptz,
  status text,
  shipping_status text,
  shipping_method text,
  tracking_code text,
  total numeric,
  items jsonb,
  envio_gratis boolean
)
language sql
security definer
set search_path = public
as $$
  select
    o.id,
    o.created_at,
    o.status,
    coalesce(o.shipping_status, 'pendiente'),
    o.shipping_method,
    o.tracking_code,
    o.total,
    to_jsonb(o.items),
    coalesce(o.coupon_kind = 'free-shipping', false)
  from public.orders o
  where upper(left(o.id::text, 8)) = upper(trim(p_order_code))
    and lower(o.customer_email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.get_order_tracking(text, text) from public;
grant execute on function public.get_order_tracking(text, text) to anon, authenticated;

create or replace function public.recalculate_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Debe coincidir con COMBO_CATEGORIES en src/lib/promos.ts
  v_combo_categories text[] := array['almohadones', 'individuales'];

  v_item jsonb;
  v_product record;
  v_items jsonb := '[]'::jsonb;
  v_item_qty integer;
  v_item_total integer;
  v_subtotal integer := 0;
  v_item_count integer := 0;

  v_linea record;
  v_disponible integer;
  v_nombre text;

  v_category text;
  -- Cantidad y base de cálculo por categoría: la promo se cuenta categoría
  -- por categoría, no sobre el total del carrito.
  v_combo_qty jsonb := '{}'::jsonb;
  v_combo_base jsonb := '{}'::jsonb;
  v_cat_qty integer;
  v_cat_base integer;
  v_combo_parts text[] := '{}';
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

  -- Cupón: la fila que devuelve cupon_vigente y cuánto descuenta.
  v_cupon record;
  v_coupon_discount integer := 0;

  v_envios jsonb;
  v_option jsonb;
  v_free_from integer;
  v_shipping_cost integer;
  v_max_configured_cost integer;
begin
  -- 0. El estado de una orden nueva lo fija la base. Lo único que puede llegar
  --    del cliente es qué compró y a dónde lo mandamos: nadie inserta una
  --    orden que ya nace pagada, despachada o con código de seguimiento.
  --    El pago lo confirma mp-webhook, que actualiza — no inserta.
  new.status := 'pending';
  new.shipping_status := 'pendiente';
  new.stock_descontado := false;
  new.mp_payment_id := null;
  new.tracking_code := null;
  new.admin_notes := null;
  new.coupon_counted := false;
  -- El código llega como lo escribió la clienta; se normaliza acá y más
  -- abajo se reemplaza por el de la tabla o se descarta.
  new.coupon_code := nullif(upper(trim(coalesce(new.coupon_code, ''))), '');
  new.coupon_kind := null;

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
      v_combo_qty := jsonb_set(
        v_combo_qty,
        array[v_product.category],
        to_jsonb(coalesce((v_combo_qty ->> v_product.category)::integer, 0) + v_item_qty),
        true
      );
      v_combo_base := jsonb_set(
        v_combo_base,
        array[v_product.category],
        to_jsonb(coalesce((v_combo_base ->> v_product.category)::integer, 0) + v_item_total),
        true
      );
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

  -- 1b. Stock: se agrupa por producto y variante antes de comparar, así dos
  --     líneas del mismo producto no pasan de a una por debajo del tope.
  --     stock null = "sin control de stock", igual que en el descuento al
  --     despachar (fn_orders_descontar_stock).
  for v_linea in
    select i ->> 'slug' as slug,
           i ->> 'variant_id' as variant_id,
           sum((i ->> 'qty')::integer)::integer as qty
      from jsonb_array_elements(v_items) i
     group by 1, 2
  loop
    if v_linea.variant_id is not null then
      select (elem ->> 'stock')::integer, p.name
        into v_disponible, v_nombre
        from public.products p,
             lateral jsonb_array_elements(p.variants) elem
       where p.slug = v_linea.slug
         and elem ->> 'id' = v_linea.variant_id
       limit 1;
    else
      select p.stock, p.name
        into v_disponible, v_nombre
        from public.products p
       where p.slug = v_linea.slug;
    end if;

    if v_disponible is not null and v_linea.qty > v_disponible then
      -- El texto del mensaje es para los logs y para el panel. Lo que lee la
      -- clienta lo escribe el checkout con `hint` y `detail`: el front no tiene
      -- que adivinar parseando esta frase, que si se toca acá se rompería allá.
      raise exception 'Sin stock suficiente de %: quedan % y se pidieron %',
        coalesce(v_nombre, v_linea.slug), v_disponible, v_linea.qty
        using errcode = 'check_violation',
              hint = 'sin-stock',
              detail = json_build_object(
                'nombre', coalesce(v_nombre, v_linea.slug),
                'quedan', v_disponible
              )::text;
    end if;
  end loop;

  -- No se vende lo que está marcado como agotado, aunque el número de stock
  -- diga otra cosa: la ficha apagada manda.
  if exists (
    select 1
      from jsonb_array_elements(v_items) i
      join public.products p on p.slug = i ->> 'slug'
     where p.in_stock is false
  ) then
    raise exception 'Hay productos del pedido que ya no están a la venta'
      using errcode = 'check_violation',
            hint = 'fuera-de-venta';
  end if;

  -- 2. Descuentos — misma regla que bestDiscount() en src/lib/promos.ts:
  --    la promo combo y la de transferencia no se combinan, gana la mayor.
  select value into v_promos from public.store_settings where key = 'marketing';
  v_promos := coalesce(v_promos -> 'promos', '{}'::jsonb);

  v_combo_enabled := coalesce((v_promos -> 'combo' ->> 'enabled')::boolean, true);
  v_combo_percent := coalesce((v_promos -> 'combo' ->> 'percent')::numeric, 10);
  v_combo_min_qty := coalesce((v_promos -> 'combo' ->> 'minQty')::integer, 2);
  v_transfer_enabled := coalesce((v_promos -> 'transferencia' ->> 'enabled')::boolean, true);
  v_transfer_percent := coalesce((v_promos -> 'transferencia' ->> 'percent')::numeric, 10);

  -- El mínimo se cuenta por categoría y por separado: 2 almohadones dan 10%
  -- sobre los almohadones, y 2 packs dan 10% sobre los individuales. Llevar
  -- uno de cada uno no alcanza.
  if v_combo_enabled then
    foreach v_category in array v_combo_categories
    loop
      v_cat_qty := coalesce((v_combo_qty ->> v_category)::integer, 0);
      v_cat_base := coalesce((v_combo_base ->> v_category)::integer, 0);

      if v_cat_qty >= v_combo_min_qty then
        v_combo_discount := v_combo_discount + round(v_cat_base * (v_combo_percent / 100));
        -- Cómo se nombra cada categoría: espejo de COMBO_NOUN en promos.ts.
        -- Los individuales se venden por pack, así que "2 individuales"
        -- confundiría: lo que hay que llevar son dos packs.
        v_combo_parts := v_combo_parts || format(
          '%s %s',
          v_combo_min_qty,
          case v_category when 'individuales' then 'packs' else v_category end
        );
      end if;
    end loop;
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
    v_discount_label := format(
      '%s%% llevando %s',
      v_combo_percent::integer,
      array_to_string(v_combo_parts, ' y ')
    );
  else
    v_discount := v_transfer_discount;
    v_discount_label := format('%s%% pagando por transferencia', v_transfer_percent::integer);
  end if;

  -- 2b. Cupón. Se valida con la misma función que usa el checkout para
  --     mostrarlo (cupon_vigente): existe, está activo, en fecha y con usos.
  --     Misma regla que cuponDiscount() y mejorDescuento() en
  --     src/lib/cupones.ts.
  if new.coupon_code is not null then
    select * into v_cupon from public.cupon_vigente(new.coupon_code);

    if not found then
      raise exception 'Cupón inválido o vencido: %', new.coupon_code
        using errcode = 'check_violation',
              hint = 'cupon-invalido',
              detail = json_build_object('codigo', new.coupon_code)::text;
    end if;

    if v_subtotal < v_cupon.min_subtotal then
      raise exception 'El cupón % pide un mínimo de % y el pedido es de %',
        v_cupon.code, v_cupon.min_subtotal, v_subtotal
        using errcode = 'check_violation',
              hint = 'cupon-minimo',
              detail = json_build_object(
                'codigo', v_cupon.code,
                'minimo', v_cupon.min_subtotal
              )::text;
    end if;

    new.coupon_code := v_cupon.code;
    new.coupon_kind := v_cupon.kind;

    if v_cupon.kind = 'percent' then
      v_coupon_discount := round(v_subtotal * (v_cupon.value::numeric / 100));
    elsif v_cupon.kind = 'fixed' then
      v_coupon_discount := least(v_subtotal, greatest(0, v_cupon.value));
    end if;

    -- El cupón de plata no se suma a las promos: gana el mayor, y en empate
    -- el cupón. Si la promo da más, la orden se guarda sin cupón —así no se
    -- le cuenta un uso por un descuento que no se aplicó—. El de envío
    -- gratis no entra en esta comparación: no toca los productos.
    if v_cupon.kind <> 'free-shipping' then
      if v_coupon_discount >= v_discount then
        v_discount := v_coupon_discount;
        v_discount_label := case v_cupon.kind
          when 'percent' then format('Cupón %s · %s%%', v_cupon.code, v_cupon.value)
          else format('Cupón %s', v_cupon.code)
        end;
      else
        new.coupon_code := null;
        new.coupon_kind := null;
      end if;
    end if;
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

  -- El cupón de envío gratis pone el envío en cero, sea cual sea el método.
  -- Con el envío a coordinar ya era cero: lo que cambia es que la orden
  -- queda marcada (coupon_kind) y el panel no lo cobra por WhatsApp.
  if new.coupon_kind = 'free-shipping' then
    v_shipping_cost := 0;
  end if;

  new.shipping_cost := v_shipping_cost;
  new.total := v_subtotal - v_discount + v_shipping_cost;

  return new;
end;
$$;

revoke all on function public.recalculate_order_totals() from public;

-- ============================================================
-- El uso del cupón se cuenta al cobrar, no al insertar.
--
-- Corre antes de cada update de `orders`: cuando `status` pasa a 'paid' por
-- primera vez —lo hace mp-webhook con la clave de servicio, o el panel al
-- confirmar una transferencia— suma uno a `discounts.uses` y marca la orden
-- para no volver a contarla. Un pedido de Mercado Pago que quedó pendiente
-- nunca pasa por acá, así que no gasta el cupón. Si la orden se devuelve o
-- se cancela después, el uso no se descuenta: el cupón se usó.
-- ============================================================
create or replace function public.fn_orders_contar_cupon()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid'
     and old.status is distinct from 'paid'
     and new.coupon_code is not null
     and not old.coupon_counted
  then
    update public.discounts
       set uses = uses + 1
     where upper(code) = upper(new.coupon_code);

    new.coupon_counted := true;
  end if;

  return new;
end;
$$;

revoke all on function public.fn_orders_contar_cupon() from public;

drop trigger if exists trg_orders_contar_cupon on public.orders;
create trigger trg_orders_contar_cupon
  before update on public.orders
  for each row execute function public.fn_orders_contar_cupon();
