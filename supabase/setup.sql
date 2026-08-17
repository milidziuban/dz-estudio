-- ============================================================
-- DZ Estudio — Setup inicial de base de datos
-- Espejo del catálogo de Tienda Nube (dzestudio.mitiendanube.com).
-- Pegar completo en Supabase → SQL Editor → Run
-- ============================================================

-- ✦ Tabla de productos
-- El id es el id de producto de Tienda Nube: crece con el alta, así que
-- ordenar por id descendente equivale a ordenar por novedades.
create table public.products (
  id bigint primary key,
  slug text unique not null,
  name text not null,
  category text not null check (category in ('almohadones', 'individuales')),
  colors text[] not null default '{}',
  price integer not null,
  description text not null default '',
  medidas text not null default '',
  peso text,
  material text,
  cuidados text,
  variants jsonb not null default '[]',
  images jsonb not null default '[]',
  in_stock boolean not null default true
);

alter table public.products enable row level security;

create policy "Lectura pública de productos"
  on public.products for select
  using (true);

-- ✧ Tabla de órdenes
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  shipping_address jsonb not null,
  shipping_method text not null
    check (shipping_method in ('retiro', 'andreani-sucursal', 'andreani-domicilio')),
  items jsonb not null,
  subtotal integer not null,
  -- Promociones de Tienda Nube (10% llevando 2 almohadones / 10% transferencia)
  discount integer not null default 0,
  discount_label text,
  shipping_cost integer not null,
  total integer not null,
  payment_method text not null check (payment_method in ('mp', 'transferencia')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected', 'cancelled')),
  mp_preference_id text,
  mp_payment_id text
);

alter table public.orders enable row level security;

-- Cualquiera puede crear una orden, nadie puede leerlas con la anon key
-- (solo desde el dashboard o con service role)
create policy "Cualquiera puede crear una orden"
  on public.orders for insert
  with check (true);

-- ✿ Seed: catálogo de Tienda Nube (sincronizado 17/08/2026)
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
