-- ============================================================
-- Orden manual del catálogo — 12/10/2026
--
-- Hasta acá la tienda ordenaba por id ("novedades"): lo último que se subía
-- iba primero, y no había forma de elegir qué se ve arriba. `orden` lo decide
-- el panel (/admin/productos, flechas en cada fila): menor va antes. Arranca
-- con el orden que se veía hasta hoy —id descendente— para que nada se mueva
-- solo al publicar.
--
-- La tienda lo lee con la clave pública: hay que sumarlo al `grant select`
-- columna por columna de `costo_fuera_de_la_tienda`, o el select falla.
-- ============================================================

alter table public.products
  add column if not exists orden integer not null default 0;

update public.products p
set orden = r.n
from (
  select id, row_number() over (order by id desc) as n
  from public.products
) r
where r.id = p.id;

grant select (orden) on public.products to anon;
