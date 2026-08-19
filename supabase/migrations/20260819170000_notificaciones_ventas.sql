-- ============================================================
-- Notificaciones de ventas en vivo
--
-- El panel escucha altas en `orders` por Supabase Realtime para avisarle
-- al admin apenas entra un pedido nuevo (campanita + aviso). Realtime
-- respeta las policies de RLS ya existentes (select solo-admin), así que
-- esto no abre ninguna lectura nueva: solo hace falta sumar la tabla a la
-- publicación que usa el broadcast.
-- ============================================================

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
