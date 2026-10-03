-- ════════════════════════════════════════════════════════════════
-- Categoría "pliego" — la línea de escritorio
-- ════════════════════════════════════════════════════════════════
--
-- Suma 'pliego' al check de categoría para poder cargar sus productos
-- desde el panel. Solo eso:
--   · El combo no cambia: recalculate_order_totals sigue con
--     v_combo_categories = ['almohadones', 'individuales'], así que un
--     producto de Pliego nunca entra en la promo de 2 unidades.
--   · Que no aparezca en /tienda lo resuelve el front (esDeLaTienda en
--     src/data/products.ts).

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('almohadones', 'individuales', 'pliego'));
