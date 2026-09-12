-- ============================================================
-- Reset de datos de prueba — DZ Estudio
-- Borra órdenes, visitas y suscriptores de prueba, y devuelve a
-- products el stock que el trigger de despacho descontó de más
-- por pedidos de prueba ya marcados como "despachado".
--
-- Correr completo en Supabase → SQL Editor → Run.
-- Es IRREVERSIBLE: no hay vuelta atrás una vez ejecutado.
-- No toca `admins`, `products` (catálogo), `discounts`,
-- `store_settings` ni `stock_movimientos` (la devolución queda anotada).
-- ============================================================

-- 1) Devolver el stock descontado por órdenes de prueba ya despachadas.
--    Pasa por fn_stock_mover (la única puerta al stock) como `devolucion`,
--    así el historial de stock_movimientos sigue cerrando: el despacho de
--    prueba queda anotado y su devolución también.
do $$
declare
  ord record;
  item jsonb;
  v_slug text;
  v_variant_id text;
  v_qty integer;
begin
  for ord in select id, items from public.orders where stock_descontado loop
    for item in select * from jsonb_array_elements(ord.items) loop
      v_slug := item->>'slug';
      v_variant_id := item->>'variant_id';
      v_qty := coalesce((item->>'qty')::integer, 0);

      if v_qty <= 0 or v_slug is null then
        continue;
      end if;

      perform public.fn_stock_mover(
        v_slug, v_variant_id, v_qty, 'devolucion',
        'Reset de datos de prueba', ord.id
      );
    end loop;
  end loop;
end $$;

-- 2) Borrar todas las órdenes de prueba
delete from public.orders;

-- 3) Borrar visitas de prueba
delete from public.page_views;

-- 4) Borrar suscriptores de prueba del newsletter
delete from public.newsletter_subscribers;

-- 5) Verificación rápida — las tres deberían dar 0
select
  (select count(*) from public.orders) as ordenes,
  (select count(*) from public.page_views) as visitas,
  (select count(*) from public.newsletter_subscribers) as suscriptores;
