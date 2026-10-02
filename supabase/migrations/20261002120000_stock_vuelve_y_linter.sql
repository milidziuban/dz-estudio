-- ============================================================
-- El stock vuelve al cancelar o devolver, y limpieza del linter — 02/10/2026
--
-- 1. Un pedido que ya había descontado stock (despachado o entregado) y
--    después pasa a 'cancelled' o 'refunded' devuelve las unidades solo.
--    Hasta hoy había que cargar la devolución a mano en Distribución.
--    Se devuelve exactamente lo que el pedido descontó según
--    `stock_movimientos` —no la cantidad del ítem—: si al despachar había
--    menos de lo pedido, el descuento fue parcial y devolver de más
--    inventaría unidades. Después `stock_descontado` vuelve a false, así un
--    nuevo despacho del mismo pedido descontaría otra vez.
--
-- 2. Las tres funciones de trigger de `orders` figuraban en el linter como
--    ejecutables por `anon` y `authenticated`. No había riesgo —una función
--    de trigger no se puede llamar por RPC—, pero tampoco hace falta el
--    permiso: Postgres no lo chequea al disparar el trigger.
--
-- 3. `touch_updated_at` con search_path fijo, el último aviso de ese tipo.
--
-- Idempotente: se puede correr dos veces sin efecto.
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
  v_linea record;
begin
  -- Sale del depósito: descuenta una sola vez.
  if new.shipping_status in ('despachado', 'entregado')
     and old.shipping_status is distinct from new.shipping_status
     and not old.stock_descontado
     and new.status not in ('cancelled', 'refunded')
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

  -- Se cancela o se devuelve un pedido que ya había descontado: vuelve lo
  -- que salió, línea por línea según el historial.
  elsif new.status in ('cancelled', 'refunded')
     and old.status is distinct from new.status
     and old.stock_descontado
  then
    for v_linea in
      select slug, variant_id, -sum(delta)::integer as unidades
        from public.stock_movimientos
       where order_id = new.id
       group by slug, variant_id
      having sum(delta) < 0
    loop
      perform public.fn_stock_mover(
        v_linea.slug,
        v_linea.variant_id,
        v_linea.unidades,
        'devolucion',
        format(
          'Pedido %s %s',
          upper(left(new.id::text, 8)),
          case new.status when 'refunded' then 'devuelto' else 'cancelado' end
        ),
        new.id
      );
    end loop;

    new.stock_descontado := false;
  end if;

  return new;
end;
$$;

revoke all on function public.fn_orders_descontar_stock() from public, anon, authenticated;
revoke all on function public.fn_orders_contar_cupon() from public, anon, authenticated;
revoke all on function public.recalculate_order_totals() from public, anon, authenticated;

alter function public.touch_updated_at() set search_path = '';
