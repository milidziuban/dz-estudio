-- ============================================================
-- DZ Estudio — Sincronización con Tienda Nube (17/08/2026)
-- Reemplaza el catálogo de ejemplo por el catálogo real de la
-- tienda dzestudio.mitiendanube.com: 3 almohadones + 2 individuales,
-- con los ids, precios, fotos y categorías de Tienda Nube.
--
-- Cambios de esquema:
--   · products: se van collection / edition_* / sales / created_at
--     (Tienda Nube no expone esos datos) y entran peso / variants / in_stock.
--   · categorías: solo 'almohadones' e 'individuales' (se va 'bolsos').
--   · orders: nuevos métodos de envío (retiro, Andreani sucursal/domicilio).
--
-- Pegar completo en Supabase → SQL Editor → Run.
-- ⚠️ Borra todas las filas de public.products y las reemplaza.
--    Las órdenes guardan sus items como jsonb, así que no se rompen.
-- ============================================================

-- 1. Vaciar el catálogo actual antes de tocar el esquema
truncate table public.products;

-- 2. Columnas que ya no aplican
alter table public.products
  drop constraint if exists products_category_check,
  drop constraint if exists products_collection_check,
  drop column if exists collection,
  drop column if exists edition_number,
  drop column if exists edition_total,
  drop column if exists sales,
  drop column if exists created_at;

-- 3. Columnas nuevas
alter table public.products
  add column if not exists peso text,
  add column if not exists variants jsonb not null default '[]',
  add column if not exists in_stock boolean not null default true;

-- material y cuidados pasan a ser opcionales: Tienda Nube no los expone
alter table public.products
  alter column material drop not null,
  alter column material drop default,
  alter column cuidados drop not null,
  alter column cuidados drop default;

-- 4. Categorías reales de Tienda Nube
alter table public.products
  add constraint products_category_check
  check (category in ('almohadones', 'individuales'));

-- 5. Métodos de envío de Envío Nube
alter table public.orders
  drop constraint if exists orders_shipping_method_check;

alter table public.orders
  add constraint orders_shipping_method_check
  check (shipping_method in ('retiro', 'andreani-sucursal', 'andreani-domicilio'));

-- 5b. Descuentos por promoción (10% llevando 2 almohadones / 10% transferencia)
alter table public.orders
  add column if not exists discount integer not null default 0,
  add column if not exists discount_label text;

-- 6. Catálogo (ids = ids de producto de Tienda Nube)
insert into public.products
  (id, slug, name, category, colors, price, description, medidas, peso,
   material, cuidados, variants, images, in_stock)
values
(356622826, 'almohadones-rombo-rosa', 'Almohadones Rombo Rosa',
 'almohadones', array['pink','orange'], 23000,
 'Almohadón decorativo, textura suave y diseño versátil que combina con distintos ambientes.',
 '40 x 40 cm (aprox.)', '350 g (aprox.)', null, null, '[]'::jsonb,
 '[{"src":"/productos/almohadon-rombo-rosa.webp","fit":"contain","background":"cream"}]'::jsonb,
 true),

(361309976, 'almohadones-rayas-blanco-y-negro', 'Almohadones Rayas Blanco y Negro',
 'almohadones', array['ink','cream'], 23000,
 'Almohadón decorativo, textura suave y diseño versátil que combina con distintos ambientes.',
 '40 x 40 cm (aprox.)', '350 g (aprox.)', null, null, '[]'::jsonb,
 '[{"src":"/productos/almohadon-rayas-blanco-negro.webp","fit":"contain","background":"cream"}]'::jsonb,
 true),

(361310010, 'almohadones-rombo-celeste', 'Almohadones Rombo Celeste',
 'almohadones', array['celeste','orange'], 23000,
 'Almohadón decorativo, textura suave y diseño versátil que combina con distintos ambientes.',
 '40 x 40 cm (aprox.)', '350 g (aprox.)', null, null, '[]'::jsonb,
 '[{"src":"/productos/almohadon-rombo-celeste.webp","fit":"contain","background":"cream"}]'::jsonb,
 true),

(357072093, 'individuales-doble-pack-x2', 'Individuales Doble Pack x2',
 'individuales', array['pink','celeste'], 7100,
 'Pack de 2 individuales reversibles: de un lado diseño de rayas, del otro un diseño más orgánico, mismo color en ambas caras.',
 '30 x 42 cm cada uno · pack x2', '400 g el pack (aprox.)', null, null,
 '[{"id":"1564845157","label":"Celeste","color":"celeste"},{"id":"1564845158","label":"Rosa","color":"pink"}]'::jsonb,
 '[{"src":"/productos/individuales-doble-pack.webp","fit":"cover"}]'::jsonb,
 true),

(358182239, 'individuales-simple-pack-x2', 'Individuales Simple Pack x2',
 'individuales', array['ink','cream'], 5100,
 'Pack de 2 individuales de una sola cara, en rayas blanco y negro. La base neutra para cualquier vajilla.',
 '30 x 42 cm cada uno · pack x2', null, null, null, '[]'::jsonb,
 '[{"src":"/productos/individuales-simple-pack.webp","fit":"cover"}]'::jsonb,
 true);
