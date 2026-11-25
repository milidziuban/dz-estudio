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

-- La primera carga de números (24/11/2026) se hizo aparte y no está en este
-- archivo: el repositorio es público y esos datos no.
