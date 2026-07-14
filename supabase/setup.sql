-- ============================================================
-- DZ Estudio — Setup inicial de base de datos
-- Pegar completo en Supabase → SQL Editor → Run
-- ============================================================

-- ✦ Tabla de productos
create table public.products (
  id bigint primary key,
  slug text unique not null,
  name text not null,
  category text not null check (category in ('mesa', 'living')),
  collection text not null check (collection in ('fiesta', 'sobremesa', 'nocturna', 'editorial')),
  colors text[] not null default '{}',
  price integer not null,
  description text not null default '',
  medidas text not null default '',
  material text not null default '',
  cuidados text not null default '',
  edition_number integer not null default 1,
  edition_total integer not null default 1,
  images jsonb not null default '[]',
  sales integer not null default 0,
  created_at timestamptz not null default now()
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
  shipping_method text not null check (shipping_method in ('showroom', 'andreani', 'correo')),
  items jsonb not null,
  subtotal integer not null,
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

-- ✿ Seed: los 12 productos
insert into public.products
  (id, slug, name, category, collection, colors, price, description, medidas, material, cuidados, edition_number, edition_total, images, sales, created_at)
values
(1, 'individual-positano', 'Individual "Positano" set x2', 'mesa', 'sobremesa', array['celeste','verde'], 18000,
 'Un set de individuales para desayunos que arrancan tarde y terminan siendo almuerzos. Celeste y verde en un tejido que aguanta café derramado sin drama.',
 '45 x 33 cm cada uno · set x2', 'Algodón panamá 100%, estampado a mano',
 'Lavar a máquina con agua fría, ciclo suave. Planchar del revés. No usar lavandina.',
 12, 80,
 '[{"seed":"dz-individual-positano-1","tint":"celeste"},{"seed":"dz-individual-positano-2","tint":"verde"},{"seed":"dz-individual-positano-3","tint":"celeste"}]'::jsonb,
 34, '2026-06-10'),

(2, 'mantel-fiesta', 'Mantel "Fiesta" 200x150', 'mesa', 'fiesta', array['pink','orange'], 42000,
 'Rosa y naranja para mesas que no piden permiso. El mantel que convierte un martes cualquiera en una ocasión. Se ve mejor con la comida encima.',
 '200 x 150 cm', 'Lino y algodón, estampado serigráfico',
 'Lavar a máquina con agua fría. Secar a la sombra. Planchar con vapor del revés.',
 7, 50,
 '[{"seed":"dz-mantel-fiesta-1","tint":"pink"},{"seed":"dz-mantel-fiesta-2","tint":"orange"},{"seed":"dz-mantel-fiesta-3","tint":"pink"}]'::jsonb,
 58, '2026-05-02'),

(3, 'servilletas-domingo', 'Servilletas "Domingo" set x4', 'mesa', 'editorial', array['amarillo','petroleo'], 12000,
 'Cuatro servilletas en amarillo y petróleo para sobremesas de domingo que se estiran hasta la merienda. Para quien no le teme al color, ni a la lavandería.',
 '40 x 40 cm cada una · set x4', 'Algodón 100% con dobladillo a contraste',
 'Lavar a máquina. Aguantan todo, incluso el tuco.',
 23, 100,
 '[{"seed":"dz-servilletas-domingo-1","tint":"amarillo"},{"seed":"dz-servilletas-domingo-2","tint":"petroleo"},{"seed":"dz-servilletas-domingo-3","tint":"amarillo"}]'::jsonb,
 71, '2026-04-18'),

(4, 'camino-larga-sobremesa', 'Camino de mesa "Larga sobremesa"', 'mesa', 'nocturna', array['lila','petroleo'], 24000,
 'Rayas lila y petróleo a lo largo de toda la mesa. Pensado para cenas donde nadie mira el reloj y el postre dura más que el plato principal.',
 '180 x 40 cm', 'Algodón panamá con rayas tejidas',
 'Lavar a máquina con agua fría. Planchar con la raya, no contra.',
 15, 60,
 '[{"seed":"dz-camino-larga-sobremesa-1","tint":"lila"},{"seed":"dz-camino-larga-sobremesa-2","tint":"petroleo"},{"seed":"dz-camino-larga-sobremesa-3","tint":"lila"}]'::jsonb,
 22, '2026-06-25'),

(5, 'individual-verano', 'Individual "Verano" set x4', 'mesa', 'editorial', array['amarillo','ink'], 32000,
 'Amarillo y tinta en un set de cuatro. Gráficos, contundentes, con más presencia que algunos invitados. La base perfecta para cualquier vajilla.',
 '45 x 33 cm cada uno · set x4', 'Algodón panamá 100%, estampado serigráfico',
 'Lavar a máquina con agua fría. Planchar del revés.',
 4, 70,
 '[{"seed":"dz-individual-verano-1","tint":"amarillo"},{"seed":"dz-individual-verano-2","tint":"ink"},{"seed":"dz-individual-verano-3","tint":"amarillo"}]'::jsonb,
 15, '2026-07-01'),

(6, 'almohadon-hola-casa', 'Almohadón "Hola casa" 45x45', 'living', 'fiesta', array['orange'], 22000,
 'Naranja pleno, sin vueltas. El almohadón que saluda cuando llegás. Levanta cualquier sillón gris heredado sin pedir disculpas.',
 '45 x 45 cm · incluye relleno', 'Funda de algodón y lino, cierre invisible',
 'Funda lavable a máquina. Relleno: solo aire y cariño.',
 31, 90,
 '[{"seed":"dz-almohadon-hola-casa-1","tint":"orange"},{"seed":"dz-almohadon-hola-casa-2","tint":"orange"},{"seed":"dz-almohadon-hola-casa-3","tint":"cream"}]'::jsonb,
 44, '2026-05-20'),

(7, 'almohadon-grid', 'Almohadón "Grid" 45x45', 'living', 'nocturna', array['petroleo','cream'], 22000,
 'Damero petróleo y crema, el clásico que nunca falla. Combina con todo porque no intenta combinar con nada.',
 '45 x 45 cm · incluye relleno', 'Tejido jacquard de algodón',
 'Funda lavable a máquina con agua fría. Secar a la sombra.',
 18, 75,
 '[{"seed":"dz-almohadon-grid-1","tint":"petroleo"},{"seed":"dz-almohadon-grid-2","tint":"cream"},{"seed":"dz-almohadon-grid-3","tint":"petroleo"}]'::jsonb,
 39, '2026-06-05'),

(8, 'almohadon-bordado', 'Almohadón "Bordado" 50x30', 'living', 'nocturna', array['lila'], 26000,
 'Lila con bordado artesanal en formato apaisado. Horas de aguja e hilo para un almohadón que se gana el lugar del medio del sillón.',
 '50 x 30 cm · incluye relleno', 'Lino bordado a mano con hilos de algodón',
 'Lavar a mano con agua fría. El bordado agradece la delicadeza.',
 9, 40,
 '[{"seed":"dz-almohadon-bordado-1","tint":"lila"},{"seed":"dz-almohadon-bordado-2","tint":"lila"},{"seed":"dz-almohadon-bordado-3","tint":"cream"}]'::jsonb,
 18, '2026-06-30'),

(9, 'manta-domingo-largo', 'Manta "Domingo largo"', 'living', 'sobremesa', array['verde','cream'], 58000,
 'Rayas verde y crema en una manta hecha para siestas de domingo que empiezan con un libro y terminan sin él. Tamaño generoso, actitud tranquila.',
 '180 x 130 cm', 'Algodón peinado, tejido en telar',
 'Lavar a máquina con ciclo suave. No secar en secarropas.',
 11, 45,
 '[{"seed":"dz-manta-domingo-largo-1","tint":"verde"},{"seed":"dz-manta-domingo-largo-2","tint":"cream"},{"seed":"dz-manta-domingo-largo-3","tint":"verde"}]'::jsonb,
 27, '2026-05-12'),

(10, 'almohadon-circular', 'Almohadón "Circular" 40cm redondo', 'living', 'sobremesa', array['celeste'], 24000,
 'Redondo, celeste y absolutamente innecesario hasta que lo tenés. Después no entendés cómo vivías sin él.',
 '40 cm de diámetro · incluye relleno', 'Algodón panamá con vivo a contraste',
 'Funda lavable a máquina. Planchar con vapor suave.',
 26, 65,
 '[{"seed":"dz-almohadon-circular-1","tint":"celeste"},{"seed":"dz-almohadon-circular-2","tint":"celeste"},{"seed":"dz-almohadon-circular-3","tint":"cream"}]'::jsonb,
 31, '2026-06-18'),

(11, 'almohadon-editorial', 'Almohadón "Editorial" set x2', 'living', 'editorial', array['pink','amarillo'], 38000,
 'Rosa y amarillo en un set de dos que funciona como una tapa de revista: no podés no mirarlo. Para sillones con personalidad editorial.',
 '45 x 45 cm cada uno · set x2 · incluyen relleno', 'Algodón y lino, estampado serigráfico',
 'Fundas lavables a máquina con agua fría.',
 3, 35,
 '[{"seed":"dz-almohadon-editorial-1","tint":"pink"},{"seed":"dz-almohadon-editorial-2","tint":"amarillo"},{"seed":"dz-almohadon-editorial-3","tint":"pink"}]'::jsonb,
 12, '2026-07-08'),

(12, 'manta-nocturna', 'Manta "Nocturna"', 'living', 'nocturna', array['petroleo','pink'], 62000,
 'Petróleo profundo con destellos rosa. La manta para películas que empiezan a las once y terminan quién sabe cuándo. Nuestra pieza más pedida del invierno.',
 '190 x 140 cm', 'Algodón y lana merino, tejido en telar',
 'Lavar a mano o ciclo lana. Secar en plano a la sombra.',
 6, 30,
 '[{"seed":"dz-manta-nocturna-1","tint":"petroleo"},{"seed":"dz-manta-nocturna-2","tint":"pink"},{"seed":"dz-manta-nocturna-3","tint":"petroleo"}]'::jsonb,
 49, '2026-04-30');
