-- ============================================================
-- Stock real al despachar
--
-- Hasta ahora "stock" era un número que el admin editaba a mano: una venta
-- no lo movía. El panel mostraba "comprometido" (calculado en memoria a
-- partir de las órdenes pagadas sin despachar, ver Distribucion.tsx) pero el
-- stock real nunca bajaba, ni siquiera cuando el pedido salía del depósito.
--
-- Esto agrega el descuento real: cuando shipping_status pasa a 'despachado'
-- por primera vez, se resta la cantidad de cada línea del stock del
-- producto (o de la variante correspondiente, si el item tiene variant_id).
-- `stock_descontado` evita descontar dos veces si el estado se mueve para
-- atrás y adelante entre pantallas.
-- ============================================================

alter table public.orders
  add column if not exists stock_descontado boolean not null default false;

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
      else
        -- stock null = "sin control de stock": no se toca.
        update public.products
        set stock = greatest(0, stock - v_qty)
        where slug = v_slug and stock is not null;
      end if;
    end loop;

    new.stock_descontado := true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_descontar_stock on public.orders;
create trigger trg_orders_descontar_stock
  before update on public.orders
  for each row
  execute function public.fn_orders_descontar_stock();
