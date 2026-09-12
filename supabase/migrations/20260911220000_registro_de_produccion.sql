-- ============================================================
-- Registro de producción — 11/09/2026
--
-- El stock bajaba solo al despachar (trigger `fn_orders_descontar_stock`)
-- pero subía a mano: en Distribución y en la ficha se pisaba el número y
-- nadie sabía cuántas unidades se cosieron, cuándo, ni por qué cambió.
--
-- Esto agrega el libro de movimientos, `stock_movimientos`, y una sola
-- puerta de entrada para tocar el stock:
--
--   · `fn_stock_mover(...)`  — interna, sin permiso para nadie: aplica un
--     delta a un producto (o a una de sus variantes), con la misma regla que
--     ya usaba el despacho —no baja de 0, la ficha se apaga en 0 y se prende
--     cuando vuelve a haber— y deja el movimiento anotado en la misma
--     transacción.
--   · `registrar_movimiento_stock(...)` — la que llama el panel. Solo admins
--     (`is_admin()` adentro, `grant` solo a `authenticated`). Producción,
--     ajuste de inventario, devolución o venta fuera de la tienda.
--   · El trigger de despacho pasa a usar la misma función interna, así que
--     cada pedido que sale deja su movimiento `venta` con el `order_id`.
--
-- El stock que hay hoy queda como saldo inicial: un movimiento `ajuste` con
-- nota "saldo inicial" por cada línea con stock, para que la suma de los
-- movimientos dé el stock desde el primer día.
--
-- Idempotente: se puede correr dos veces sin romper nada (el saldo inicial
-- solo se carga en las líneas que todavía no tienen movimientos).
-- ============================================================

-- ------------------------------------------------------------
-- 1. El libro de movimientos
-- ------------------------------------------------------------
create table if not exists public.stock_movimientos (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  -- El id es la clave estable (el slug se puede editar desde la ficha); el
  -- slug se guarda igual para que el historial se lea aunque el producto se
  -- haya borrado.
  product_id bigint references public.products (id) on delete set null,
  slug text not null,
  variant_id text,
  -- Con signo, y siempre el que se aplicó de verdad: si un pedido llevaba 3
  -- y había 1, acá queda -1 y la nota lo cuenta.
  delta integer not null,
  -- Lo que quedó después del movimiento, para leer el historial sin sumar.
  saldo integer not null,
  motivo text not null
    check (motivo in ('produccion', 'ajuste', 'venta', 'devolucion')),
  order_id uuid references public.orders (id) on delete set null,
  nota text,
  created_by uuid,
  -- Nombre (o mail) del admin en ese momento: el historial se lee solo, sin
  -- cruzar con `admins`, cuya lectura está limitada a la propia fila.
  autor text
);

alter table public.stock_movimientos enable row level security;

create index if not exists stock_movimientos_created_at_idx
  on public.stock_movimientos (created_at desc);
create index if not exists stock_movimientos_product_idx
  on public.stock_movimientos (product_id, created_at desc);

-- Solo lectura, y solo para admins. No hay policy de insert/update/delete a
-- propósito: la única forma de escribir es la función de abajo.
drop policy if exists "Admin lee movimientos de stock" on public.stock_movimientos;
create policy "Admin lee movimientos de stock"
  on public.stock_movimientos for select
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- 2. La función interna: aplica el delta y anota el movimiento
--
-- Devuelve el saldo resultante, o null si la línea no controla stock (o el
-- producto/variante no existe): en ese caso no hace nada, igual que hacía el
-- trigger de despacho. Las validaciones con mensaje para la persona están
-- en `registrar_movimiento_stock`; acá solo la mecánica.
-- ------------------------------------------------------------
create or replace function public.fn_stock_mover(
  p_slug text,
  p_variant_id text,
  p_delta integer,
  p_motivo text,
  p_nota text,
  p_order_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product record;
  v_anterior integer;
  v_nuevo integer;
  v_nota text := nullif(btrim(coalesce(p_nota, '')), '');
  v_autor text;
begin
  -- Bloquea la fila del producto: dos movimientos al mismo tiempo (un
  -- despacho y una producción) se aplican uno después del otro.
  select id, slug, stock, variants
    into v_product
    from public.products
   where slug = p_slug
     for update;

  if not found then
    return null;
  end if;

  if p_variant_id is not null then
    select (elem ->> 'stock')::integer
      into v_anterior
      from jsonb_array_elements(coalesce(v_product.variants, '[]'::jsonb)) elem
     where elem ->> 'id' = p_variant_id;

    -- Variante inexistente, o sin control de stock: no se toca.
    if not found or v_anterior is null then
      return null;
    end if;

    v_nuevo := greatest(0, v_anterior + p_delta);

    -- variants es jsonb: hay que reescribir el array entero.
    update public.products
       set variants = (
         select coalesce(jsonb_agg(
           case
             when elem ->> 'id' = p_variant_id
               then jsonb_set(elem, '{stock}', to_jsonb(v_nuevo))
             else elem
           end
         ), '[]'::jsonb)
           from jsonb_array_elements(variants) elem
       )
     where id = v_product.id;

    -- Segunda pasada, no el mismo UPDATE: adentro de un UPDATE las columnas
    -- leen el valor viejo, así que la ficha se recalcula recién cuando las
    -- variantes ya quedaron guardadas. Prendida si alguna variante tiene
    -- unidades (o no controla stock), apagada si todas están en 0.
    update public.products p
       set in_stock = exists (
         select 1
           from jsonb_array_elements(p.variants) elem
          where elem ->> 'stock' is null
             or (elem ->> 'stock')::integer > 0
       )
     where p.id = v_product.id;
  else
    -- stock null = "sin control de stock": no se toca.
    if v_product.stock is null then
      return null;
    end if;

    v_anterior := v_product.stock;
    v_nuevo := greatest(0, v_anterior + p_delta);

    update public.products
       set stock = v_nuevo,
           in_stock = (v_nuevo > 0)
     where id = v_product.id;
  end if;

  -- Si el pedido pedía más de lo que había, el delta anotado es el real y la
  -- nota cuenta la diferencia: así la suma del historial siempre da el stock.
  if v_nuevo - v_anterior <> p_delta then
    v_nota := concat_ws(
      ' · ',
      v_nota,
      format('El movimiento era de %s y había %s', p_delta, v_anterior)
    );
  end if;

  select coalesce(nullif(btrim(nombre), ''), email)
    into v_autor
    from public.admins
   where user_id = auth.uid();

  insert into public.stock_movimientos
    (product_id, slug, variant_id, delta, saldo, motivo, order_id, nota, created_by, autor)
  values
    (v_product.id, v_product.slug, p_variant_id, v_nuevo - v_anterior, v_nuevo,
     p_motivo, p_order_id, v_nota, auth.uid(), v_autor);

  return v_nuevo;
end;
$$;

-- Nadie la llama directo: solo el trigger y la función de abajo, que corren
-- como el dueño.
revoke all on function public.fn_stock_mover(text, text, integer, text, text, uuid)
  from public, anon, authenticated;

-- ------------------------------------------------------------
-- 3. La puerta del panel
-- ------------------------------------------------------------
create or replace function public.registrar_movimiento_stock(
  p_slug text,
  p_variant_id text,
  p_delta integer,
  p_motivo text,
  p_nota text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product record;
  v_stock integer;
  v_saldo integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede mover stock'
      using errcode = '42501';
  end if;

  if p_motivo not in ('produccion', 'ajuste', 'venta', 'devolucion') then
    raise exception 'Motivo desconocido: %', p_motivo
      using errcode = '22023';
  end if;

  if p_delta is null or p_delta = 0 then
    raise exception 'El movimiento tiene que ser de al menos una unidad'
      using errcode = '22023';
  end if;

  -- Cada motivo tiene su dirección: lo que se cose entra, lo que se vende
  -- sale. Un ajuste va para cualquier lado.
  if p_motivo in ('produccion', 'devolucion') and p_delta < 0 then
    raise exception 'Una % suma unidades: el delta tiene que ser positivo',
      case p_motivo when 'produccion' then 'producción' else 'devolución' end
      using errcode = '22023';
  end if;

  if p_motivo = 'venta' and p_delta > 0 then
    raise exception 'Una venta resta unidades: el delta tiene que ser negativo'
      using errcode = '22023';
  end if;

  select id, stock, variants
    into v_product
    from public.products
   where slug = p_slug;

  if not found then
    raise exception 'No hay ningún producto con el slug %', p_slug
      using errcode = 'P0002';
  end if;

  if p_variant_id is not null then
    if jsonb_array_length(coalesce(v_product.variants, '[]'::jsonb)) = 0 then
      raise exception 'Ese producto no tiene variantes'
        using errcode = 'P0002';
    end if;

    select (elem ->> 'stock')::integer
      into v_stock
      from jsonb_array_elements(v_product.variants) elem
     where elem ->> 'id' = p_variant_id;

    if not found then
      raise exception 'Ese producto no tiene la variante %', p_variant_id
        using errcode = 'P0002';
    end if;
  else
    if jsonb_array_length(coalesce(v_product.variants, '[]'::jsonb)) > 0 then
      raise exception 'Ese producto tiene variantes: el stock se mueve variante por variante'
        using errcode = '22023';
    end if;

    v_stock := v_product.stock;
  end if;

  if v_stock is null then
    raise exception 'Esa línea no controla stock: prendé el control en la ficha del producto antes de registrar movimientos'
      using errcode = '22023';
  end if;

  if v_stock + p_delta < 0 then
    raise exception 'No se pueden sacar % unidades: hay %', -p_delta, v_stock
      using errcode = '22023';
  end if;

  v_saldo := public.fn_stock_mover(p_slug, p_variant_id, p_delta, p_motivo, p_nota, null);

  return v_saldo;
end;
$$;

-- Supabase les da execute por default a anon y authenticated: el revoke a
-- public no alcanza, hay que sacárselo a anon a mano.
revoke all on function public.registrar_movimiento_stock(text, text, integer, text, text)
  from public, anon;
grant execute on function public.registrar_movimiento_stock(text, text, integer, text, text) to authenticated;

-- ------------------------------------------------------------
-- 4. El despacho deja su movimiento
--
-- Misma condición de siempre (pasa a 'despachado' por primera vez); lo que
-- cambia es que el descuento lo hace `fn_stock_mover`, que además anota la
-- venta con el id del pedido. Pasa a `security definer` para poder llamarla:
-- la función interna no tiene permiso para el rol que edita la orden.
-- ------------------------------------------------------------
create or replace function public.fn_orders_descontar_stock()
returns trigger
language plpgsql
security definer
set search_path = public
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
      v_slug := item ->> 'slug';
      v_variant_id := item ->> 'variant_id';
      v_qty := coalesce((item ->> 'qty')::integer, 0);

      if v_qty <= 0 or v_slug is null then
        continue;
      end if;

      -- Devuelve null si la línea no controla stock o el producto ya no
      -- existe: en los dos casos no hay nada que descontar ni anotar.
      perform public.fn_stock_mover(
        v_slug,
        v_variant_id,
        -v_qty,
        'venta',
        format('Pedido %s', upper(left(new.id::text, 8))),
        new.id
      );
    end loop;

    new.stock_descontado := true;
  end if;

  return new;
end;
$$;

revoke all on function public.fn_orders_descontar_stock() from public;

-- ------------------------------------------------------------
-- 5. Saldo inicial: el stock de hoy, como primer movimiento
--
-- Una línea por producto sin variantes con stock, y una por variante con
-- stock. Solo en las líneas que todavía no tienen ningún movimiento, así la
-- migración se puede correr dos veces.
-- ------------------------------------------------------------
insert into public.stock_movimientos
  (product_id, slug, variant_id, delta, saldo, motivo, nota)
select p.id, p.slug, null, p.stock, p.stock, 'ajuste', 'saldo inicial'
  from public.products p
 where p.stock is not null
   and p.stock > 0
   and jsonb_array_length(coalesce(p.variants, '[]'::jsonb)) = 0
   and not exists (
     select 1
       from public.stock_movimientos m
      where m.product_id = p.id and m.variant_id is null
   );

insert into public.stock_movimientos
  (product_id, slug, variant_id, delta, saldo, motivo, nota)
select p.id, p.slug, elem ->> 'id',
       (elem ->> 'stock')::integer, (elem ->> 'stock')::integer,
       'ajuste', 'saldo inicial'
  from public.products p,
       jsonb_array_elements(coalesce(p.variants, '[]'::jsonb)) elem
 where elem ->> 'stock' is not null
   and (elem ->> 'stock')::integer > 0
   and not exists (
     select 1
       from public.stock_movimientos m
      where m.product_id = p.id and m.variant_id = elem ->> 'id'
   );
