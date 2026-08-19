-- ============================================================
-- Notas del pedido
--
-- El cliente puede dejar una nota libre en el checkout (instrucciones de
-- entrega, un pedido especial, lo que sea). Es de solo lectura para el
-- admin: distinta de `admin_notes`, que es la nota interna que carga el
-- local.
-- ============================================================

alter table public.orders
  add column if not exists customer_notes text;
