-- ============================================================
-- El embudo se mide en la base de la tienda — 10/09/2026
--
-- Hasta hoy el panel sabía dos cosas: cuánta gente entró (`page_views`) y
-- quién compró (`orders`). Los dos pasos del medio —agregar al carrito y
-- empezar el checkout— se medían solo en GA4 y en el pixel de Meta, que no se
-- leen desde /admin y que además tardan horas en mostrar el dato. Así que la
-- pregunta de la primera semana ("¿agregan al carrito y no compran, o ni
-- siquiera llegan al carrito?") no se podía contestar el mismo día.
--
-- Esta tabla guarda esos dos eventos con el mismo id de sesión que
-- `page_views`, que es lo que permite cruzarlos y armar el embudo por sesión.
-- No identifica a nadie: el id vive en sessionStorage y se borra al cerrar la
-- pestaña, igual que el de las visitas.
--
-- Idempotente: se puede correr dos veces sin romper nada.
-- ============================================================

create table if not exists public.store_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  -- Qué pasó. La lista es cerrada a propósito: el `check` es lo que evita que
  -- con la anon key se llene la tabla de eventos inventados.
  kind text not null check (kind in ('add_to_cart', 'begin_checkout')),
  -- Mismo id de sesión que page_views, para poder cruzar los dos lados
  session_id text not null,
  -- Producto, cuando el evento es de uno solo (`add_to_cart`). En
  -- `begin_checkout` va null: el carrito puede tener varios.
  slug text,
  -- Unidades. En `add_to_cart` es la línea (tope 50, el de la base); en
  -- `begin_checkout` es el carrito entero, que puede sumar más de una línea.
  qty integer,
  -- Valor en ARS del evento, para poder ver cuánta plata queda en el camino
  value integer
);

alter table public.store_events enable row level security;

create index if not exists store_events_created_at_idx
  on public.store_events (created_at desc);

-- El visitante no está logueado, así que el insert tiene que ser público —
-- igual que el de las visitas. Los topes son los que evitan que una fila
-- inventada ocupe de más; el `check` del `kind` ya está en la tabla.
drop policy if exists "Cualquiera registra un evento" on public.store_events;
create policy "Cualquiera registra un evento"
  on public.store_events for insert
  with check (
    length(session_id) <= 64
    and (slug is null or length(slug) <= 120)
    -- El tope no es el de una línea (50): en `begin_checkout` viaja la suma
    -- del carrito, que son varias. Alcanza con que sea un número acotado.
    and (qty is null or (qty >= 0 and qty <= 999))
    and (value is null or (value >= 0 and value <= 100000000))
  );

drop policy if exists "Admin lee eventos" on public.store_events;
create policy "Admin lee eventos"
  on public.store_events for select
  to authenticated
  using (public.is_admin());

-- Los permisos de tabla los da el default de Supabase para el schema public,
-- igual que en `page_views`: lo que restringe de verdad son las dos policies
-- de arriba, y sin una de select el visitante no puede leer nada de acá.
--
-- Como en `page_views`, el insert público hace que los números sean
-- orientativos: alguien con la anon key podría inflarlos. Sirven para leer la
-- forma del embudo, no para auditar.
