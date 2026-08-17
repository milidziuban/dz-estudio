-- ============================================================
-- DZ Estudio — Panel de administración (18/08/2026)
--
-- Todo lo que el panel /admin necesita del lado de la base:
--   · admins        → quién puede entrar (whitelist por user_id de auth)
--   · is_admin()    → la función que usan todas las policies
--   · products      → policies de escritura + stock y sku
--   · orders        → lectura/edición para el admin + estado de envío
--   · page_views    → visitas propias (para las métricas del dashboard)
--   · discounts     → cupones de descuento
--   · store_settings→ pagos, envíos, distribución y marketing (jsonb)
--   · newsletter_subscribers → suscriptores del formulario del home
--
-- Pegar completo en Supabase → SQL Editor → Run.
-- Es idempotente: se puede correr dos veces sin romper nada.
--
-- ⚠️ PASO MANUAL OBLIGATORIO (al final del archivo, comentado):
--    crear el usuario en Authentication → Users y después insertarlo
--    en public.admins. Sin esa fila, el panel no deja entrar a nadie.
-- ============================================================

-- ============================================================
-- 1. Quién es admin
-- ============================================================

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- security definer + search_path fijo: la función lee public.admins salteando
-- su propia RLS. Si leyera con los permisos del que llama, cada policy que la
-- usa entraría en recursión infinita.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Un admin ve su propia fila" on public.admins;
create policy "Un admin ve su propia fila"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

-- Nadie puede darse de alta a sí mismo: los insert/update/delete de admins
-- solo se hacen desde el SQL Editor o con la service role key.

-- ============================================================
-- 2. Productos — escritura para el admin, stock y sku
-- ============================================================

alter table public.products
  add column if not exists sku text,
  -- null = sin control de stock (se vende siempre que in_stock sea true)
  add column if not exists stock integer;

drop policy if exists "Admin crea productos" on public.products;
create policy "Admin crea productos"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admin edita productos" on public.products;
create policy "Admin edita productos"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin borra productos" on public.products;
create policy "Admin borra productos"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- 3. Órdenes — el admin las lee y las gestiona
-- ============================================================

alter table public.orders
  add column if not exists shipping_status text not null default 'pendiente',
  add column if not exists tracking_code text,
  add column if not exists admin_notes text;

alter table public.orders
  drop constraint if exists orders_shipping_status_check;
alter table public.orders
  add constraint orders_shipping_status_check
  check (shipping_status in ('pendiente', 'preparando', 'despachado', 'entregado'));

-- 'refunded' entra al set de estados de pago: una devolución no es lo mismo
-- que un rechazo de la pasarela.
alter table public.orders
  drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'rejected', 'cancelled', 'refunded'));

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);
create index if not exists orders_customer_email_idx
  on public.orders (customer_email);

drop policy if exists "Admin lee órdenes" on public.orders;
create policy "Admin lee órdenes"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admin edita órdenes" on public.orders;
create policy "Admin edita órdenes"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 4. Visitas
--
-- GA4 sirve para analizar, pero no se puede consultar desde el panel sin
-- montar la API de reporting. Estas filas son las que alimentan las tarjetas
-- de visitas y la conversión del dashboard.
-- ⚠️ El insert es público (lo hace el visitante con la anon key), así que los
--    números son orientativos: alguien con la clave podría inflarlos.
-- ============================================================

create table if not exists public.page_views (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  path text not null,
  referrer text,
  -- id de sesión guardado en sessionStorage del visitante, no identifica a nadie
  session_id text not null,
  is_new_session boolean not null default false
);

alter table public.page_views enable row level security;

create index if not exists page_views_created_at_idx
  on public.page_views (created_at desc);

drop policy if exists "Cualquiera registra una visita" on public.page_views;
create policy "Cualquiera registra una visita"
  on public.page_views for insert
  with check (length(path) <= 300 and length(session_id) <= 64);

drop policy if exists "Admin lee visitas" on public.page_views;
create policy "Admin lee visitas"
  on public.page_views for select
  to authenticated
  using (public.is_admin());

-- ============================================================
-- 5. Cupones de descuento
-- ============================================================

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text unique not null,
  description text,
  kind text not null default 'percent'
    check (kind in ('percent', 'fixed', 'free-shipping')),
  -- percent: 1 a 100 · fixed: monto en ARS · free-shipping: se ignora
  value integer not null default 0,
  min_subtotal integer not null default 0,
  -- null = usos ilimitados
  max_uses integer,
  uses integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true
);

alter table public.discounts enable row level security;

-- La tienda solo ve los cupones vigentes (para validarlos en el checkout).
drop policy if exists "Lectura pública de cupones vigentes" on public.discounts;
create policy "Lectura pública de cupones vigentes"
  on public.discounts for select
  using (
    active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
    and (max_uses is null or uses < max_uses)
  );

drop policy if exists "Admin gestiona cupones" on public.discounts;
create policy "Admin gestiona cupones"
  on public.discounts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 6. Configuración de la tienda
--
-- Una fila por sección del panel, el contenido en jsonb. Así agregar un campo
-- a "métodos de envío" no pide una migración nueva.
-- ============================================================

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_settings_touch on public.store_settings;
create trigger store_settings_touch
  before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- La tienda necesita leer la config (costos de envío, datos bancarios).
drop policy if exists "Lectura pública de configuración" on public.store_settings;
create policy "Lectura pública de configuración"
  on public.store_settings for select
  using (true);

drop policy if exists "Admin edita configuración" on public.store_settings;
create policy "Admin edita configuración"
  on public.store_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Valores iniciales: los mismos que hoy están hardcodeados en el front
-- (src/lib/checkout.ts, src/lib/promos.ts y src/lib/site.ts).
insert into public.store_settings (key, value) values
('pagos', '{
  "mercadopago": { "enabled": true, "installments": 3, "installmentsLabel": "3 cuotas sin interés", "maxInstallments": 6 },
  "transferencia": {
    "enabled": true,
    "discountPercent": 10,
    "banco": "[TU BANCO]",
    "titular": "[TITULAR DE LA CUENTA]",
    "cuit": "27-41860878-7",
    "cbu": "[CBU]",
    "alias": "[ALIAS]"
  }
}'::jsonb),

('envios', '{
  "options": [
    { "id": "retiro", "label": "Retiro en el depósito", "detail": "Tacuarí 7618, Guadalupe · Santa Fe Capital · lun a vie de 9 a 18", "cost": 0, "enabled": true },
    { "id": "andreani-sucursal", "label": "Andreani a sucursal", "detail": "3 a 6 días hábiles", "cost": 7200, "enabled": true },
    { "id": "andreani-domicilio", "label": "Andreani a domicilio", "detail": "3 a 6 días hábiles", "cost": 9500, "enabled": true }
  ],
  "freeShippingFrom": null
}'::jsonb),

('distribucion', '{
  "locations": [
    {
      "id": "santa-fe",
      "nombre": "Depósito Santa Fe Ciudad",
      "direccion": "Tacuarí 7618, Guadalupe, Santa Fe Capital",
      "horario": "Lunes a viernes de 9 a 18",
      "retiro": true,
      "principal": true
    }
  ],
  "lowStockThreshold": 3
}'::jsonb),

('marketing', '{
  "gaId": null,
  "instagram": "dzestudio_",
  "whatsapp": "342 529 9662",
  "marquee": [
    "3 cuotas sin interés",
    "10% off pagando por transferencia",
    "10% llevando 2 almohadones",
    "Envíos a todo el país",
    "Retiro gratis en Santa Fe Capital"
  ],
  "promos": {
    "almohadones": { "enabled": true, "percent": 10, "minQty": 2 },
    "transferencia": { "enabled": true, "percent": 10 }
  }
}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- 7. Suscriptores del newsletter
-- ============================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text unique not null,
  source text not null default 'home',
  active boolean not null default true
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Cualquiera se suscribe" on public.newsletter_subscribers;
create policy "Cualquiera se suscribe"
  on public.newsletter_subscribers for insert
  with check (length(email) <= 200);

drop policy if exists "Admin gestiona suscriptores" on public.newsletter_subscribers;
create policy "Admin gestiona suscriptores"
  on public.newsletter_subscribers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 8. Storage para las fotos de producto
--
-- Hasta ahora las fotos vivían en /public/productos, así que cambiar una foto
-- pedía un deploy. Con este bucket se suben desde el panel.
-- Las fotos que ya están en /public siguen funcionando: el campo `src` acepta
-- tanto una ruta local como una URL completa.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "Lectura pública de fotos de producto" on storage.objects;
create policy "Lectura pública de fotos de producto"
  on storage.objects for select
  using (bucket_id = 'productos');

drop policy if exists "Admin sube fotos de producto" on storage.objects;
create policy "Admin sube fotos de producto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "Admin reemplaza fotos de producto" on storage.objects;
create policy "Admin reemplaza fotos de producto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'productos' and public.is_admin())
  with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "Admin borra fotos de producto" on storage.objects;
create policy "Admin borra fotos de producto"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'productos' and public.is_admin());

-- ============================================================
-- 9. PASO MANUAL — darte de alta como admin
--
--  a) Supabase → Authentication → Users → Add user → Create new user
--     Email: milagrosdziuban1@gmail.com (o el que quieras usar para entrar)
--     Password: la que elijas · marcá "Auto Confirm User"
--
--  b) Descomentá y corré este insert con tu email:
--
-- insert into public.admins (user_id, email, nombre)
-- select id, email, 'Milagros'
--   from auth.users
--  where email = 'milagrosdziuban1@gmail.com'
-- on conflict (user_id) do nothing;
--
--  c) Verificá que quedó una sola fila:
--
-- select email, created_at from public.admins;
--
--  d) En Authentication → Providers, desactivá "Enable user signups".
--     Sin signups abiertos, nadie puede crearse una cuenta desde afuera.
-- ============================================================
