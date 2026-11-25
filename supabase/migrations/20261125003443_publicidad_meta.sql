-- ============================================================
-- La publicidad de Meta, en el panel — 24/11/2026
--
-- Los números de los anuncios viven en el Administrador de anuncios de Meta,
-- que está pensado para agencias. Estas tablas guardan una copia en limpio
-- para /admin/publicidad: las campañas, lo que hizo cada una cada día y a
-- quién se le mostraron.
--
-- Las llena la Edge Function `meta-ads` (con service role) leyendo la API de
-- Meta en modo lectura. Desde el navegador no se escribe nada acá: no hay
-- policies de insert, update ni delete. El panel solo lee, y solo si sos admin.
--
-- El `id` de la campaña es el de Meta, que es también el `utm_campaign` que
-- guardan las visitas en `page_views`: eso permite cruzar lo que cobró Meta
-- con lo que pasó adentro de la tienda.
--
-- Idempotente: se puede correr dos veces sin romper nada.
-- ============================================================

create table if not exists public.meta_campanas (
  id text primary key,
  nombre text not null,
  estado text not null default 'completada'
    check (estado in ('activa', 'en_revision', 'completada', 'pausada', 'con_problema')),
  -- A dónde manda el botón del anuncio. Los de 'perfil' no traen visitas a la
  -- tienda, así que no se los mide con la misma vara.
  destino text not null default 'web' check (destino in ('web', 'perfil', 'otro')),
  inicio date,
  fin date,
  presupuesto numeric(12, 2),
  -- Personas distintas que la vieron en toda su vida. No se puede sumar por
  -- día ni entre campañas: la misma persona contaría dos veces.
  alcance integer not null default 0,
  -- El posteo de Instagram que se promocionó
  link text,
  actualizado timestamptz not null default now()
);

create table if not exists public.meta_diario (
  campana_id text not null references public.meta_campanas (id) on delete cascade,
  -- El día en la zona horaria de la cuenta publicitaria
  fecha date not null,
  gasto numeric(12, 2) not null default 0,
  impresiones integer not null default 0,
  clics integer not null default 0,
  -- "Visitas a la página de destino": el clic llegó y la tienda cargó
  visitas integer not null default 0,
  interacciones integer not null default 0,
  reacciones integer not null default 0,
  guardados integer not null default 0,
  carritos integer not null default 0,
  checkouts integer not null default 0,
  compras integer not null default 0,
  valor_compras numeric(12, 2) not null default 0,
  primary key (campana_id, fecha)
);

-- A quién se le mostró, sumando todas las campañas desde el principio
create table if not exists public.meta_publico (
  tipo text not null check (tipo in ('edad', 'sexo', 'provincia', 'lugar')),
  valor text not null,
  gasto numeric(12, 2) not null default 0,
  impresiones integer not null default 0,
  clics integer not null default 0,
  primary key (tipo, valor)
);

-- Una sola fila: cuándo se leyó Meta por última vez y cómo
create table if not exists public.meta_sync (
  id boolean primary key default true check (id),
  actualizado timestamptz not null default now(),
  -- 'api': la lectura automática. 'a-mano': copiado del Administrador de
  -- anuncios antes de conectar la cuenta.
  origen text not null default 'a-mano' check (origen in ('api', 'a-mano')),
  -- Personas distintas alcanzadas por todas las campañas juntas
  alcance_total integer,
  error text
);

alter table public.meta_campanas enable row level security;
alter table public.meta_diario enable row level security;
alter table public.meta_publico enable row level security;
alter table public.meta_sync enable row level security;

drop policy if exists "Admin lee campañas de Meta" on public.meta_campanas;
create policy "Admin lee campañas de Meta"
  on public.meta_campanas for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admin lee el diario de Meta" on public.meta_diario;
create policy "Admin lee el diario de Meta"
  on public.meta_diario for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admin lee el público de Meta" on public.meta_publico;
create policy "Admin lee el público de Meta"
  on public.meta_publico for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admin lee el estado de Meta" on public.meta_sync;
create policy "Admin lee el estado de Meta"
  on public.meta_sync for select to authenticated
  using ((select public.is_admin()));

revoke all on public.meta_campanas, public.meta_diario,
  public.meta_publico, public.meta_sync from anon;
revoke insert, update, delete, truncate on public.meta_campanas,
  public.meta_diario, public.meta_publico, public.meta_sync from authenticated;

-- ── Primera carga ────────────────────────────────────────────
--
-- Los números que tenía el Administrador de anuncios el 24/11/2026, copiados
-- a mano y verificados contra sus totales ($13.691,59 · 6.590 impresiones ·
-- 172 clics · 136 visitas). La lectura automática los pisa la primera vez que
-- corre: los ids son los de Meta.

insert into public.meta_campanas
  (id, nombre, estado, destino, inicio, fin, presupuesto, alcance)
values
  ('120255119105350616', 'Dupla Azul 💙 Una con...', 'en_revision', 'web', '2026-11-23', '2026-11-25', 4600, 909),
  ('120255135582220616', 'Nuevos almohadones...', 'activa', 'web', '2026-11-24', '2026-11-25', 2300, 85),
  ('120254525852330616', 'Rosa, celeste, rayas:...', 'completada', 'web', '2026-10-20', '2026-10-21', 2200, 1066),
  ('120254213299780616', 'Cuál va mejor con tu...', 'completada', 'web', '2026-09-30', '2026-10-01', 3061, 1442),
  ('120254030850810616', 'Nuestros almohadones 🩷...', 'completada', 'perfil', '2026-09-20', '2026-09-21', 2200, 64),
  ('120253976107200616', 'Teoría del color para...', 'completada', 'web', '2026-09-16', '2026-09-17', 2200, 1221),
  ('120253886496720616', 'Cómo comprar en la web...', 'completada', 'web', '2026-09-10', '2026-09-11', 2200, 943),
  ('120253885550790616', 'Individuales...', 'completada', 'perfil', '2026-09-10', '2026-09-11', 2200, 418)
on conflict (id) do nothing;

insert into public.meta_diario
  (campana_id, fecha, gasto, impresiones, clics, visitas, interacciones, reacciones, guardados)
values
  ('120255119105350616', '2026-11-24', 1515.56, 1007, 27, 24, 383, 4, 0),
  ('120255119105350616', '2026-11-23', 92.84, 29, 1, 1, 8, 0, 0),
  ('120255135582220616', '2026-11-24', 189.09, 90, 2, 2, 15, 0, 0),
  ('120254525852330616', '2026-10-21', 1365.61, 851, 29, 29, 203, 1, 1),
  ('120254525852330616', '2026-10-20', 813.64, 336, 12, 9, 106, 2, 0),
  ('120254213299780616', '2026-10-01', 2278.05, 1354, 34, 34, 301, 7, 5),
  ('120254213299780616', '2026-09-30', 739.50, 227, 19, 16, 71, 0, 3),
  ('120254030850810616', '2026-09-21', 467.93, 64, 3, 0, 26, 1, 0),
  ('120253976107200616', '2026-09-17', 2070.96, 1228, 14, 10, 285, 0, 1),
  ('120253976107200616', '2026-09-16', 122.41, 27, 0, 0, 10, 0, 0),
  ('120253886496720616', '2026-09-11', 1843.87, 948, 16, 11, 162, 1, 0),
  ('120253886496720616', '2026-09-10', 4.06, 1, 0, 0, 0, 0, 0),
  ('120253885550790616', '2026-09-11', 1431.55, 262, 11, 0, 150, 2, 0),
  ('120253885550790616', '2026-09-10', 756.52, 166, 4, 0, 83, 1, 1)
on conflict (campana_id, fecha) do nothing;

insert into public.meta_publico (tipo, valor, gasto, impresiones, clics)
values
  ('edad', '18-24', 1223.52, 768, 24),
  ('edad', '25-34', 3880.29, 2524, 73),
  ('edad', '35-44', 2980.45, 1260, 29),
  ('edad', '45-54', 2276.48, 790, 17),
  ('edad', '55-64', 1567.39, 608, 15),
  ('edad', '65+', 1763.46, 640, 14),
  ('sexo', 'Mujeres', 12091.33, 5559, 147),
  ('sexo', 'Varones', 1531.65, 988, 19),
  ('sexo', 'Sin dato', 68.61, 43, 6),
  ('provincia', 'Buenos Aires', 9240.66, 4170, 92),
  ('provincia', 'CABA', 1785.87, 790, 32),
  ('provincia', 'Santa Fe', 1032.88, 621, 21),
  ('provincia', 'Córdoba', 546.98, 390, 9),
  ('provincia', 'Tucumán', 135.50, 77, 4),
  ('provincia', 'Entre Ríos', 129.39, 82, 0),
  ('provincia', 'Río Negro', 87.93, 34, 2),
  ('provincia', 'Mendoza', 86.46, 66, 1),
  ('provincia', 'Jujuy', 77.85, 15, 1),
  ('provincia', 'Chubut', 77.41, 27, 3),
  ('provincia', 'La Pampa', 68.63, 31, 1),
  ('provincia', 'Misiones', 67.41, 40, 0),
  ('provincia', 'San Luis', 55.21, 38, 0),
  ('provincia', 'Chaco', 53.17, 37, 1),
  ('provincia', 'Corrientes', 40.42, 32, 1),
  ('provincia', 'Salta', 37.12, 25, 1),
  ('provincia', 'San Juan', 36.56, 24, 1),
  ('provincia', 'Neuquén', 34.12, 25, 2),
  ('provincia', 'Santa Cruz', 33.79, 13, 0),
  ('provincia', 'Santiago del Estero', 31.86, 24, 0),
  ('provincia', 'Tierra del Fuego', 12.22, 10, 0),
  ('provincia', 'La Rioja', 9.97, 7, 0),
  ('provincia', 'Catamarca', 5.70, 6, 0),
  ('provincia', 'Formosa', 4.47, 6, 0)
on conflict (tipo, valor) do nothing;

insert into public.meta_sync (id, actualizado, origen, alcance_total)
values (true, '2026-11-24T20:30:00-03:00', 'a-mano', 5793)
on conflict (id) do nothing;
