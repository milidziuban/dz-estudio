-- ============================================================
-- El retiro también descuenta stock — 30/09/2026
--
-- El trigger de despacho solo miraba `shipping_status = 'despachado'`. Un
-- pedido con retiro en el depósito no pasa por ese estado: va de
-- 'pendiente' (o 'preparando') directo a 'entregado', así que nunca
-- descontaba nada. Pasó con los dos pedidos de retiro de septiembre.
--
-- Ahora descuenta la primera vez que el pedido sale del depósito, sea
-- 'despachado' o 'entregado'. `stock_descontado` sigue evitando el doble
-- descuento cuando un envío pasa por los dos estados.
-- ============================================================

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
  if new.shipping_status in ('despachado', 'entregado')
     and old.shipping_status is distinct from new.shipping_status
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
