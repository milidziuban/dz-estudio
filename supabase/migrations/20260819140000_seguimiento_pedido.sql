-- ============================================================
-- Seguí tu pedido — lookup público de una orden puntual
--
-- La tabla orders no se abre a "anon": la RLS de panel_admin la deja
-- solo para el admin. Acá se agrega una función que devuelve el estado
-- de UNA orden puntual, y solo si quien pregunta ya sabe el código corto
-- (los primeros 8 caracteres del id, los mismos que ve el cliente en
-- "Pedido #XXXXXXXX" y en el WhatsApp de confirmación) Y el email con el
-- que compró. No expone el resto de la tabla ni permite listar órdenes.
-- ============================================================

create or replace function public.get_order_tracking(
  p_order_code text,
  p_email text
)
returns table (
  id uuid,
  created_at timestamptz,
  status text,
  shipping_status text,
  shipping_method text,
  tracking_code text,
  total numeric,
  items jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    o.id,
    o.created_at,
    o.status,
    coalesce(o.shipping_status, 'pendiente'),
    o.shipping_method,
    o.tracking_code,
    o.total,
    to_jsonb(o.items)
  from public.orders o
  where upper(left(o.id::text, 8)) = upper(trim(p_order_code))
    and lower(o.customer_email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.get_order_tracking(text, text) from public;
grant execute on function public.get_order_tracking(text, text) to anon, authenticated;
