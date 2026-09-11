-- ============================================================
-- Aviso de pedido nuevo — 11/09/2026
--
-- La compra del 10/09 (a pagar por transferencia) entró en la base y la
-- clienta recibió su mail, pero de este lado no avisó nadie: la campanita
-- del panel solo suena si el panel está abierto en ese momento, y no
-- existía un mail para la administradora.
--
-- Ahora `order-email` manda un cuarto mail, `nuevo-pedido`, a los mails de
-- la tabla `admins`: sale solo cuando entra una transferencia y cuando
-- Mercado Pago aprueba un pago. Usa la misma tabla `order_emails` para
-- salir una sola vez por pedido, así que hay que dejarlo entrar en la
-- lista cerrada de `kind`.
--
-- Idempotente: se puede correr dos veces sin romper nada.
-- ============================================================

alter table public.order_emails
  drop constraint if exists order_emails_kind_check;

alter table public.order_emails
  add constraint order_emails_kind_check check (
    kind in ('transferencia', 'pago-confirmado', 'despachado', 'nuevo-pedido')
  );

-- Los pedidos que ya tenían mail antes de este cambio se atendieron desde el
-- panel: se dan por avisados, así un guardado posterior de la orden no
-- dispara el aviso tarde.
insert into public.order_emails (order_id, kind)
select distinct order_id, 'nuevo-pedido'
  from public.order_emails
 where kind in ('transferencia', 'pago-confirmado')
on conflict do nothing;
