-- Productos ocultos y categoría Lámparas (27/11/2026).
--
-- `visible = false` deja un producto cargado pero fuera de la tienda: la
-- lectura pública solo devuelve los visibles, y la cuenta admin (logueada en
-- el mismo navegador) los ve todos, así puede revisar la ficha antes de
-- publicarla. Lo hace RLS y no el front: un slug adivinado tampoco lo trae.

alter table public.products
  add column if not exists visible boolean not null default true;

comment on column public.products.visible is
  'false = oculto: solo lo ve la cuenta admin. Se prende desde la ficha del panel.';

-- anon tiene el select recortado por columna (costo_fuera_de_la_tienda):
-- la tienda pide `visible` para marcarle a Mili lo que está oculto.
grant select (visible) on public.products to anon;

drop policy if exists "Lectura pública de productos" on public.products;
create policy "Lectura pública de productos" on public.products
  for select
  using (visible or (select public.is_admin()));

alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check
  check (category = any (array['almohadones', 'individuales', 'pliego', 'manteles', 'lamparas']));
