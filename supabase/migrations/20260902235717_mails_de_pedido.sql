-- ============================================================
-- Mails del pedido
--
-- Registro de qué mail se mandó para qué orden. La clave primaria
-- (order_id, kind) es lo que hace que cada mail salga UNA sola vez:
-- Mercado Pago reintenta la misma notificación varias veces, y el panel
-- puede volver a guardar una orden ya despachada. La Edge Function
-- `order-email` inserta acá ANTES de mandar; si la fila ya existe, no
-- manda. Si Resend falla, borra la fila para que el reintento sirva.
-- ============================================================

create table if not exists public.order_emails (
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (
    kind in ('transferencia', 'pago-confirmado', 'despachado')
  ),
  sent_at timestamptz not null default now(),
  primary key (order_id, kind)
);

alter table public.order_emails enable row level security;

-- Escribe solo la Edge Function, que va con service role y saltea RLS.
-- El admin lee para poder ver en el panel qué se le mandó a quién.
drop policy if exists "Admin lee los mails mandados" on public.order_emails;
create policy "Admin lee los mails mandados"
  on public.order_emails
  for select
  to authenticated
  using (public.is_admin());
