-- ============================================================
-- Reset de datos de prueba — DZ Estudio
-- Borra órdenes, visitas y suscriptores de prueba, y devuelve a
-- products el stock que el trigger de despacho descontó de más
-- por pedidos de prueba ya marcados como "despachado".
--
-- Correr completo en Supabase → SQL Editor → Run.
-- Es IRREVERSIBLE: no hay vuelta atrás una vez ejecutado.
-- No toca `admins`, `products` (catálogo), `discounts` ni
-- `store_settings`.
-- ============================================================

-- 1) Devolver el stock descontado por órdenes de prueba ya despachadas
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

      if v_variant_id is not null then
        update public.products
        set variants = (
          select coalesce(jsonb_agg(
            case
              when elem->>'id' = v_variant_id and elem->>'stock' is not null
                then jsonb_set(
                  elem,
                  '{stock}',
                  to_jsonb((elem->>'stock')::integer + v_qty)
                )
              else elem
            end
          ), '[]'::jsonb)
          from jsonb_array_elements(variants) as elem
        )
        where slug = v_slug;
      else
        update public.products
        set stock = stock + v_qty
        where slug = v_slug and stock is not null;
      end if;
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
