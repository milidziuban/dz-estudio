-- ============================================================
-- DZ Estudio — Precios y costos (19/08/2026)
--
-- Soporta la nueva pantalla /admin/precios: costo unitario por producto,
-- si el producto ya es un paquete/combo, el parámetro de margen global, y
-- renombra la promo "almohadones" (categoría fija) a "combo" (corre sobre
-- almohadones e individuales por igual).
--
-- Pegar completo en Supabase → SQL Editor → Run. Es idempotente.
-- ============================================================

-- ============================================================
-- 1. Productos — costo unitario y si ya es un paquete
-- ============================================================

alter table public.products
  add column if not exists cost integer,
  add column if not exists is_bundle boolean not null default false;

-- ============================================================
-- 2. store_settings.precios — margen de ganancia global
-- ============================================================

insert into public.store_settings (key, value) values
('precios', '{ "marginPercent": 100 }'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- 3. store_settings.marketing — la promo pasa de "almohadones" a "combo"
--    (mismo valor, nueva clave, ahora corre sobre almohadones e individuales)
-- ============================================================

update public.store_settings
set value = jsonb_set(
  value #- '{promos,almohadones}',
  '{promos,combo}',
  coalesce(value #> '{promos,almohadones}', '{"enabled": true, "percent": 10, "minQty": 2}'::jsonb)
)
where key = 'marketing'
  and value #> '{promos,almohadones}' is not null;

-- ============================================================
-- 4. Catálogo real — costo, paquete y precio de lista recalculado
--
-- Con margen 100% y descuento por combo 10% (los defaults de arriba):
--   Almohadones (no son paquete): costo 9.111 → lista 9.111×2 = 18.222,
--     redondeado hacia arriba al múltiplo de $100 → $18.300.
--   Individuales Pack x2 (ya son el combo): costo = 2 unidades,
--     lista = costo×2×0.9, redondeado hacia arriba → $6.500 / $4.900.
-- ============================================================

update public.products set cost = 9111, is_bundle = false, price = 18300
where id in (356622826, 361309976, 361310010); -- almohadones rombo rosa / rayas / celeste

update public.products set cost = 3600, is_bundle = true, price = 6500
where id = 357072093; -- individuales doble pack x2

update public.products set cost = 2700, is_bundle = true, price = 4900
where id = 358182239; -- individuales simple pack x2
