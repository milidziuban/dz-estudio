-- 06/11/2026 — Nueva categoría: manteles. Se suma al CHECK sin sacar las que
-- ya estaban (pliego incluida). Y se carga el primer mantel, sin fotos: la
-- tienda no publica productos sin fotos, así que aparece recién cuando se le
-- sube la primera desde /admin/productos.

alter table public.products drop constraint if exists products_category_check;
alter table public.products
  add constraint products_category_check
  check (category in ('almohadones', 'individuales', 'pliego', 'manteles'));

-- Costo: 1,80 m de gabardina acrílica pesada rayada a $15.270 el metro.
-- Precio: costo × 1,8 ÷ 0,56, redondeado hacia arriba a $100.
insert into public.products (
  id, slug, name, category, colors, price, cost, description, medidas,
  material, cuidados, images, variants, stock, in_stock, is_bundle, orden
)
select
  1794020000,
  'mantel-rayas-rosa-y-rojo-mediano',
  'Mantel Rayas Rosa y Rojo · Mediano · 130 × 180 cm',
  'manteles',
  array['pink', 'orange'],
  88400,
  27486,
  'Rayas rosas y rojas de punta a punta, en gabardina acrílica impermeable de las pesadas: cae derecho y no se arruga con mirarlo. Mide 130 × 180 cm, así que en una mesa de 80 × 120 cm deja unos 25 cm de caída por lado. Lo que se vuelca se queda arriba y se levanta con un paño húmedo. Hay uno solo.',
  '130 x 180 cm · mediano',
  'Gabardina acrílica impermeable (pesada)',
  'Lavar con agua fría, a ciclo suave o a mano. No secar al sol.',
  '[]'::jsonb,
  '[]'::jsonb,
  0,
  false,
  false,
  coalesce((select min(orden) from public.products), 1) - 1
where not exists (
  select 1 from public.products where slug = 'mantel-rayas-rosa-y-rojo-mediano'
);

-- La unidad entra por la misma puerta que el resto del stock, así queda en el
-- historial de Distribución.
select public.fn_stock_mover(
  'mantel-rayas-rosa-y-rojo-mediano', null, 1, 'produccion',
  'Alta del producto: 1 unidad', null
)
where (select stock from public.products
        where slug = 'mantel-rayas-rosa-y-rojo-mediano') = 0;
