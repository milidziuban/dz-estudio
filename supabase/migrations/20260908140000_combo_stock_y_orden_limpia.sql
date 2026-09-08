-- ============================================================
-- Tres agujeros que encontró la revisión previa al lanzamiento — 08/09/2026
--
-- 1. EL COMBO DE INDIVIDUALES SE MOSTRABA Y NO SE COBRABA.
--    El 02/09 la promo se extendió a individuales en src/lib/promos.ts, pero
--    `recalculate_order_totals` se quedó con array['almohadones']. El checkout
--    mostraba "10% llevando 2 packs" y Mercado Pago cobraba el total sin el
--    descuento: la clienta veía un precio y pagaba otro.
--    De paso se corrige algo más viejo: la función sumaba las cantidades de
--    todas las categorías del combo en un solo contador, así que 1 almohadón +
--    1 pack llegaba al mínimo de 2 y disparaba el descuento. El front lo cuenta
--    por categoría y por separado (`comboDiscount` en src/lib/promos.ts).
--    Ahora la base hace lo mismo, y la etiqueta nombra las categorías que
--    entraron de verdad, igual que `bestDiscount`.
--
-- 2. NADA ATABA LA VENTA AL STOCK.
--    El trigger validaba `qty > 50` y nunca miraba `products.stock`, así que
--    entraban pedidos de 5 unidades habiendo 3. Y cuando el stock llegaba a 0
--    al despachar, `in_stock` seguía en true: la ficha quedaba publicada
--    diciendo que había, y le vendía a la siguiente. Nada ponía esa columna en
--    false salvo el panel a mano.
--    Ahora el insert rechaza lo que no hay, y despachar apaga la ficha sola.
--
-- 3. SE PODÍA INSERTAR UNA ORDEN YA MARCADA COMO PAGADA.
--    La policy de insert es `with check (true)` y el trigger corregía precios,
--    descuento y envío pero no tocaba `status`. Con la anon key —que está en
--    el bundle, es su función— se podía meter una orden en `paid`: aparecía en
--    Ventas como cobrada, sonaba la campanita y entraba en la facturación.
--    Ahora el estado de una orden nueva lo fija la base, no quien la manda.
-- ============================================================

-- ------------------------------------------------------------
-- 1 + 2 + 3: el trigger que valida y arma toda orden nueva
-- ------------------------------------------------------------
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
      raise exception 'Sin stock suficiente de %: quedan % y se pidieron %',
        coalesce(v_nombre, v_linea.slug), v_disponible, v_linea.qty
        using errcode = 'check_violation';
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
      using errcode = 'check_violation';
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

-- ------------------------------------------------------------
-- 3 (segunda cerradura): la policy dice lo mismo que el trigger
--
-- Con el trigger alcanza, porque el WITH CHECK se evalúa sobre la fila ya
-- corregida. Se escribe igual para que el día que alguien toque el trigger la
-- regla siga estando en la policy, que es donde uno la va a buscar.
-- ------------------------------------------------------------
drop policy if exists "Cualquiera puede crear una orden" on public.orders;
create policy "Cualquiera puede crear una orden"
  on public.orders for insert
  with check (
    status = 'pending'
    and shipping_status = 'pendiente'
    and stock_descontado = false
    and mp_payment_id is null
    and tracking_code is null
    and admin_notes is null
  );

-- ------------------------------------------------------------
-- 2 (segunda mitad): despachar apaga la ficha cuando no queda nada
-- ------------------------------------------------------------
create or replace function public.fn_orders_descontar_stock()
returns trigger
language plpgsql
as $$
declare
  item jsonb;
  v_slug text;
  v_variant_id text;
  v_qty integer;
begin
  if new.shipping_status = 'despachado'
     and old.shipping_status is distinct from 'despachado'
     and not old.stock_descontado
  then
    for item in select * from jsonb_array_elements(new.items)
    loop
      v_slug := item->>'slug';
      v_variant_id := item->>'variant_id';
      v_qty := coalesce((item->>'qty')::integer, 0);

      if v_qty <= 0 or v_slug is null then
        continue;
      end if;

      if v_variant_id is not null then
        -- variants es jsonb: hay que reescribir el array entero, igual que
        -- useQuickUpdateVariantStock del lado del cliente.
        update public.products
        set variants = (
          select coalesce(jsonb_agg(
            case
              when elem->>'id' = v_variant_id and elem->>'stock' is not null
                then jsonb_set(
                  elem,
                  '{stock}',
                  to_jsonb(greatest(0, (elem->>'stock')::integer - v_qty))
                )
              else elem
            end
          ), '[]'::jsonb)
          from jsonb_array_elements(variants) as elem
        )
        where slug = v_slug;

        -- Segunda pasada, no el mismo UPDATE: adentro de un UPDATE las
        -- columnas leen el valor viejo, así que el estado de la ficha se
        -- recalcula recién cuando las variantes ya quedaron guardadas.
        update public.products p
        set in_stock = exists (
          select 1
            from jsonb_array_elements(p.variants) elem
           where elem ->> 'stock' is null
              or (elem ->> 'stock')::integer > 0
        )
        where p.slug = v_slug
          and jsonb_array_length(coalesce(p.variants, '[]'::jsonb)) > 0;
      else
        -- stock null = "sin control de stock": no se toca.
        -- `stock` a la derecha es el valor viejo, así que las dos columnas se
        -- calculan sobre el mismo número.
        update public.products
        set stock = greatest(0, stock - v_qty),
            in_stock = (greatest(0, stock - v_qty) > 0)
        where slug = v_slug and stock is not null;
      end if;
    end loop;

    new.stock_descontado := true;
  end if;

  return new;
end;
$$;
