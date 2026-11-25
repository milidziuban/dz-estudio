-- ============================================================
-- Instagram en el panel — 24/11/2026
--
-- Los números de @dzestudio_ y el informe que se saca de ellos, para
-- /admin/instagram. Se cargan a mano cada vez que se hace una lectura (salen
-- de las estadísticas de Meta Business Suite): desde el navegador no se
-- escribe nada acá y el panel solo lee, y solo si sos admin.
--
-- Los datos no están en este archivo: el repositorio es público.
--
-- Idempotente: se puede correr dos veces sin romper nada.
-- ============================================================

create table if not exists public.ig_posts (
  id text primary key,
  publicado timestamptz not null,
  tipo text not null check (tipo in ('carrusel', 'reel', 'foto', 'historia')),
  -- De qué trata, clasificado al leer. Las historias no lo llevan.
  tema text check (tema in ('producto', 'combinar', 'uso', 'proceso', 'novedad', 'explicativo', 'cercania')),
  texto text,
  -- Las columnas `_pagas` / `_pago` son la parte que trajo la pauta. Lo que
  -- rinde una publicación por sí sola es la resta.
  vistas integer not null default 0,
  vistas_pagas integer not null default 0,
  -- En las historias, el alcance es la cantidad de espectadores
  alcance integer not null default 0,
  alcance_pago integer not null default 0,
  interacciones integer not null default 0,
  interacciones_pagas integer not null default 0,
  me_gusta integer not null default 0,
  comentarios integer not null default 0,
  compartidos integer not null default 0,
  guardados integer not null default 0,
  clics integer not null default 0,
  respuestas integer not null default 0,
  seguidores integer not null default 0,
  -- Segundos que se mira en promedio, solo en reels
  segundos integer
);

create table if not exists public.ig_diario (
  fecha date primary key,
  vistas integer not null default 0,
  interacciones integer not null default 0,
  clics integer not null default 0,
  -- Visitas al perfil
  visitas integer not null default 0,
  -- Seguidores nuevos ese día
  seguidores integer not null default 0
);

create table if not exists public.ig_publico (
  tipo text not null check (tipo in ('edad', 'sexo', 'ciudad')),
  valor text not null,
  -- % de los seguidores
  parte numeric(5, 2) not null,
  primary key (tipo, valor)
);

-- Un informe por lectura: conclusiones, qué hacer, ideas y competencia. La
-- forma del json está en src/types/instagram.ts.
create table if not exists public.ig_informes (
  fecha date primary key,
  contenido jsonb not null
);

alter table public.ig_posts enable row level security;
alter table public.ig_diario enable row level security;
alter table public.ig_publico enable row level security;
alter table public.ig_informes enable row level security;

drop policy if exists "Admin lee posts de Instagram" on public.ig_posts;
create policy "Admin lee posts de Instagram" on public.ig_posts
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admin lee el diario de Instagram" on public.ig_diario;
create policy "Admin lee el diario de Instagram" on public.ig_diario
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admin lee el público de Instagram" on public.ig_publico;
create policy "Admin lee el público de Instagram" on public.ig_publico
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admin lee los informes de Instagram" on public.ig_informes;
create policy "Admin lee los informes de Instagram" on public.ig_informes
  for select to authenticated using ((select public.is_admin()));

revoke all on public.ig_posts, public.ig_diario, public.ig_publico,
  public.ig_informes from anon;
revoke insert, update, delete, truncate on public.ig_posts, public.ig_diario,
  public.ig_publico, public.ig_informes from authenticated;
