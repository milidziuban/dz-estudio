-- ============================================================
-- DZ Estudio — Migración de catálogo (jul 2026)
-- Reemplaza el catálogo viejo (mesa/living: manteles, servilletas,
-- caminos de mesa, mantas) por el catálogo real: almohadones,
-- individuales y bolsos.
-- Pegar completo en Supabase → SQL Editor → Run.
-- ⚠️ Esto borra todas las filas de public.products y las reemplaza.
-- Si ya tenés órdenes reales con esos IDs de producto, revisá antes
-- de correrlo (las órdenes guardan los items como jsonb, no como FK,
-- así que no se rompen, pero los IDs de producto ya no existirán).
-- ============================================================

-- 1. Sacar el check constraint viejo de categoría
alter table public.products
  drop constraint if exists products_category_check;

-- 2. Vaciar el catálogo actual
truncate table public.products;

-- 3. Poner el constraint nuevo
alter table public.products
  add constraint products_category_check
  check (category in ('almohadones', 'individuales', 'bolsos'));

-- 4. Insertar el catálogo nuevo
insert into public.products
  (id, slug, name, category, collection, colors, price, description, medidas, material, cuidados, edition_number, edition_total, images, sales, created_at)
values
(1, 'individual-positano', 'Individual "Positano" set x2', 'individuales', 'sobremesa', array['celeste','verde'], 18000,
 'Estampado a mano en algodón panamá, celeste y verde. Para desayunos que terminan siendo almuerzo y sobreviven al café derramado.',
 '45 x 33 cm cada uno · set x2', 'Algodón panamá 100%, estampado a mano',
 'Lavar a máquina con agua fría, ciclo suave. Planchar del revés. No usar lavandina.',
 12, 80,
 '[{"seed":"dz-individual-positano-1","tint":"celeste"},{"seed":"dz-individual-positano-2","tint":"verde"},{"seed":"dz-individual-positano-3","tint":"celeste"}]'::jsonb,
 34, '2026-06-10'),

(2, 'individual-verano', 'Individual "Verano" set x4', 'individuales', 'editorial', array['amarillo','ink'], 32000,
 'Cuatro individuales en amarillo y tinta, estampado serigráfico sobre algodón panamá. La base para cualquier vajilla, sin pedir nada a cambio.',
 '45 x 33 cm cada uno · set x4', 'Algodón panamá 100%, estampado serigráfico',
 'Lavar a máquina con agua fría. Planchar del revés.',
 4, 70,
 '[{"seed":"dz-individual-verano-1","tint":"amarillo"},{"seed":"dz-individual-verano-2","tint":"ink"},{"seed":"dz-individual-verano-3","tint":"amarillo"}]'::jsonb,
 15, '2026-07-01'),

(3, 'almohadon-hola-casa', 'Almohadón "Hola casa" 45x45', 'almohadones', 'fiesta', array['orange'], 22000,
 'Naranja pleno, sin estampado ni excusas. Funda de algodón y lino con cierre invisible, pensada para sillones que necesitan un empujón.',
 '45 x 45 cm · incluye relleno', 'Funda de algodón y lino, cierre invisible',
 'Funda lavable a máquina. Relleno: solo aire y cariño.',
 31, 90,
 '[{"seed":"dz-almohadon-hola-casa-1","tint":"orange"},{"seed":"dz-almohadon-hola-casa-2","tint":"orange"},{"seed":"dz-almohadon-hola-casa-3","tint":"cream"}]'::jsonb,
 44, '2026-05-20'),

(4, 'almohadon-grid', 'Almohadón "Grid" 45x45', 'almohadones', 'nocturna', array['petroleo','cream'], 22000,
 'Jacquard de algodón en damero petróleo y crema. El almohadón que combina con lo que ya tenés, sin intentarlo.',
 '45 x 45 cm · incluye relleno', 'Tejido jacquard de algodón',
 'Funda lavable a máquina con agua fría. Secar a la sombra.',
 18, 75,
 '[{"seed":"dz-almohadon-grid-1","tint":"petroleo"},{"seed":"dz-almohadon-grid-2","tint":"cream"},{"seed":"dz-almohadon-grid-3","tint":"petroleo"}]'::jsonb,
 39, '2026-06-05'),

(5, 'almohadon-bordado', 'Almohadón "Bordado" 50x30', 'almohadones', 'nocturna', array['lila'], 26000,
 'Bordado a mano sobre lino lila, formato apaisado. Horas de aguja para una pieza que no se apura.',
 '50 x 30 cm · incluye relleno', 'Lino bordado a mano con hilos de algodón',
 'Lavar a mano con agua fría. El bordado agradece la delicadeza.',
 9, 40,
 '[{"seed":"dz-almohadon-bordado-1","tint":"lila"},{"seed":"dz-almohadon-bordado-2","tint":"lila"},{"seed":"dz-almohadon-bordado-3","tint":"cream"}]'::jsonb,
 18, '2026-06-30'),

(6, 'almohadon-circular', 'Almohadón "Circular" 40cm redondo', 'almohadones', 'sobremesa', array['celeste'], 24000,
 'Redondo, celeste, con vivo a contraste. No es imprescindible hasta que lo tenés en el sillón.',
 '40 cm de diámetro · incluye relleno', 'Algodón panamá con vivo a contraste',
 'Funda lavable a máquina. Planchar con vapor suave.',
 26, 65,
 '[{"seed":"dz-almohadon-circular-1","tint":"celeste"},{"seed":"dz-almohadon-circular-2","tint":"celeste"},{"seed":"dz-almohadon-circular-3","tint":"cream"}]'::jsonb,
 31, '2026-06-18'),

(7, 'almohadon-editorial', 'Almohadón "Editorial" set x2', 'almohadones', 'editorial', array['pink','amarillo'], 38000,
 'Rosa y amarillo en estampado serigráfico sobre algodón y lino. Un set pensado como tapa de revista, para sillones que no necesitan ayuda.',
 '45 x 45 cm cada uno · set x2 · incluyen relleno', 'Algodón y lino, estampado serigráfico',
 'Fundas lavables a máquina con agua fría.',
 3, 35,
 '[{"seed":"dz-almohadon-editorial-1","tint":"pink"},{"seed":"dz-almohadon-editorial-2","tint":"amarillo"},{"seed":"dz-almohadon-editorial-3","tint":"pink"}]'::jsonb,
 12, '2026-07-08'),

(8, 'bolso-domingo', 'Tote "Domingo"', 'bolsos', 'sobremesa', array['verde','cream'], 34000,
 'Lona de algodón gruesa, rayas verde y crema. Entra el súper de la semana y el libro que no vas a leer.',
 '40 x 45 cm · asas 60 cm', 'Lona de algodón 100%, asas reforzadas',
 'Lavar a mano o en bolsa de lavado, ciclo suave. No retorcer las asas.',
 11, 45,
 '[{"seed":"dz-bolso-domingo-1","tint":"verde"},{"seed":"dz-bolso-domingo-2","tint":"cream"},{"seed":"dz-bolso-domingo-3","tint":"verde"}]'::jsonb,
 27, '2026-05-12'),

(9, 'bolso-nocturna', 'Tote "Nocturna"', 'bolsos', 'nocturna', array['petroleo','pink'], 36000,
 'Lona reforzada en petróleo con detalle rosa. Asas largas, fondo ancho, ninguna urgencia por combinar con el resto.',
 '42 x 48 cm · asas 65 cm', 'Lona de algodón 100%, asas de cuero reciclado',
 'Lavar a mano con agua fría. Secar en plano a la sombra.',
 6, 30,
 '[{"seed":"dz-bolso-nocturna-1","tint":"petroleo"},{"seed":"dz-bolso-nocturna-2","tint":"pink"},{"seed":"dz-bolso-nocturna-3","tint":"petroleo"}]'::jsonb,
 49, '2026-04-30'),

(10, 'bolso-mercado', 'Tote "Mercado"', 'bolsos', 'editorial', array['amarillo','petroleo'], 30000,
 'Amarillo y petróleo en lona de algodón resistente. Para la feria del sábado y todo lo demás.',
 '38 x 42 cm · asas 55 cm', 'Lona de algodón 100%, base reforzada',
 'Lavar a máquina con agua fría. Aguanta todo, incluso el tuco.',
 23, 100,
 '[{"seed":"dz-bolso-mercado-1","tint":"amarillo"},{"seed":"dz-bolso-mercado-2","tint":"petroleo"},{"seed":"dz-bolso-mercado-3","tint":"amarillo"}]'::jsonb,
 71, '2026-04-18');
