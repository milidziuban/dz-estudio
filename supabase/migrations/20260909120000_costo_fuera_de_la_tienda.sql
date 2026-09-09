-- ============================================================
-- El costo de cada producto deja de viajar al navegador — 09/09/2026
--
-- La lectura pública de `products` incluía la columna `cost`: en la pestaña
-- Red del navegador se veía `cost: 9111` en los almohadones y, con el margen
-- que está en el panel, se deducía toda la estructura de precios.
--
-- Achicar el `select` de la tienda no alcanza: con la clave pública cualquiera
-- pide `select=*` y la tabla contesta entera. Lo que corta de verdad es el
-- permiso: `anon` pasa a tener SELECT columna por columna, y `cost` no está en
-- la lista. `sku` e `is_bundle` tampoco: son datos del panel y la tienda no
-- los usa.
--
-- Ojo con el efecto de esto: desde acá, un `select=*` con la clave pública
-- falla con "permission denied for column cost" en vez de devolver de más. La
-- tienda ya pide las columnas por nombre (src/hooks/useProducts.ts) y el
-- sitemap pide solo `slug`. El panel entra como `authenticated`, que conserva
-- el permiso sobre la tabla entera, y las Edge Functions usan la service role.
-- ============================================================

revoke select on public.products from anon;

grant select (
  id,
  slug,
  name,
  category,
  colors,
  price,
  description,
  medidas,
  peso,
  peso_gramos,
  material,
  cuidados,
  variants,
  images,
  in_stock,
  stock
) on public.products to anon;
