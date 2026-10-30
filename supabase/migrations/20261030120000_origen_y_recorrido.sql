-- ============================================================
-- De dónde vienen y qué hacen adentro — 30/10/2026
--
-- Lo que mostró la base después de siete semanas abierta:
--
--   · 709 sesiones, y casi la mitad (330) llegan "sin dato": el navegador
--     interno de Instagram y los links de WhatsApp no mandan referrer, así que
--     no se sabe si vinieron de la bio, de una historia o de un mensaje.
--   · 390 sesiones ven la home y se van sin tocar nada. No se sabía hasta
--     dónde bajaban.
--   · 18 sesiones empezaron el checkout y entraron 6 pedidos. No se sabía en
--     qué paso se quedaban las otras doce, ni cuántas se iban a WhatsApp.
--
-- Esta migración agrega lo que falta para contestar eso, sin identificar a
-- nadie: sigue todo colgado del mismo id de sesión de sessionStorage.
--
--   1. `page_views` guarda, en la primera vista de la sesión, la campaña del
--      link (utm_*), si el link traía un id de click de Meta/Google, desde qué
--      app se abrió (Instagram, Facebook, TikTok) y si es celular o compu.
--   2. `store_events` suma eventos nuevos: ficha vista, filtros, clicks a
--      WhatsApp e Instagram, hasta dónde se baja en la página, cada paso del
--      checkout, el pedido confirmado y los errores al confirmarlo. Y dos
--      columnas: `path` (dónde pasó) y `detail` (el dato chico del evento).
--
-- Idempotente: se puede correr dos veces sin romper nada.
-- ============================================================

-- ── 1. Origen de la visita ───────────────────────────────────

alter table public.page_views
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  -- 'fbclid' | 'gclid' | 'ttclid': el link lo armó Meta, Google o TikTok.
  -- No dice si fue pago: Instagram le pega `fbclid` también a los links
  -- orgánicos. Sirve para separar "vino de una red" de "vino de verdad directo".
  add column if not exists click_id text,
  -- 'instagram' | 'facebook' | 'tiktok', leído del navegador interno de la app
  add column if not exists app text,
  -- 'mobile' | 'tablet' | 'desktop'
  add column if not exists device text;

drop policy if exists "Cualquiera registra una visita" on public.page_views;
create policy "Cualquiera registra una visita"
  on public.page_views for insert
  with check (
    length(path) <= 300
    and length(session_id) <= 64
    and (utm_source is null or length(utm_source) <= 100)
    and (utm_medium is null or length(utm_medium) <= 100)
    and (utm_campaign is null or length(utm_campaign) <= 100)
    and (utm_content is null or length(utm_content) <= 100)
    and (click_id is null or click_id in ('fbclid', 'gclid', 'ttclid'))
    and (app is null or app in ('instagram', 'facebook', 'tiktok'))
    and (device is null or device in ('mobile', 'tablet', 'desktop'))
  );

create index if not exists page_views_session_idx
  on public.page_views (session_id);

-- ── 2. Lo que pasa adentro ───────────────────────────────────

alter table public.store_events
  add column if not exists path text,
  add column if not exists detail text;

-- La lista sigue cerrada a propósito: es lo que evita que con la anon key se
-- llene la tabla de eventos inventados.
alter table public.store_events drop constraint if exists store_events_kind_check;
alter table public.store_events add constraint store_events_kind_check
  check (kind in (
    'add_to_cart',     -- agregó al carrito (slug, qty, value)
    'begin_checkout',  -- entró al checkout (qty, value)
    'view_item',       -- abrió una ficha (slug)
    'checkout_step',   -- pasó de paso en el checkout (detail: 'envio' | 'pago:<envío elegido>')
    'order_created',   -- confirmó el pedido (detail: '<pago>/<envío>', value)
    'checkout_error',  -- el pedido no entró (detail: el error)
    'contact_click',   -- tocó WhatsApp o Instagram (detail: 'whatsapp' | 'instagram')
    'filter',          -- usó un filtro u orden de la tienda (detail: 'categoria:x' | 'orden:x')
    'scroll'           -- llegó a ese % de la página (qty: 25 | 50 | 75 | 100)
  ));

drop policy if exists "Cualquiera registra un evento" on public.store_events;
create policy "Cualquiera registra un evento"
  on public.store_events for insert
  with check (
    length(session_id) <= 64
    and (slug is null or length(slug) <= 120)
    and (qty is null or (qty >= 0 and qty <= 999))
    and (value is null or (value >= 0 and value <= 100000000))
    and (path is null or length(path) <= 300)
    and (detail is null or length(detail) <= 120)
  );

create index if not exists store_events_session_idx
  on public.store_events (session_id);
