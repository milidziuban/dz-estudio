-- Envío a todo el país a precio fijo y precios con el envío repartido
-- (28/09/2026).
--
-- - Entra el método "envio-nacional": $15.000 fijos a cualquier destino, y
--   gratis desde $50.000 de subtotal (antes de descuentos). El envío real sale
--   ~$22.000; lo que la clienta no paga lo pone la tienda.
-- - Para cubrirlo, los productos suben ~44% (precio anterior ÷ 0,56,
--   redondeado hacia arriba a $100).
-- - "Envío a coordinar" se apaga pero no se borra: hay pedidos viejos con ese
--   método y el CHECK lo sigue aceptando.
--
-- ORDEN: se corre DESPUÉS de desplegar el código. El front viejo no conoce
-- "envio-nacional" y su validación rechazaría el único método prendido.
--
-- Idempotente: se puede correr dos veces sin efecto. recalculate_order_totals
-- no se toca: ya maneja modo "fijo" y freeShippingFrom sobre el subtotal.

-- 1. El método nuevo entra en el CHECK de orders.
alter table public.orders
  drop constraint if exists orders_shipping_method_check;

alter table public.orders
  add constraint orders_shipping_method_check
  check (shipping_method = any (array[
    'retiro',
    'envio-nacional',
    'envio-a-coordinar',
    'andreani-sucursal',
    'andreani-domicilio',
    'correo-sucursal',
    'correo-domicilio'
  ]));

-- 2. Precios. Cada UPDATE tiene de guarda el precio anterior: si alguien ya
--    lo cambió desde el panel, no se pisa.
update public.products
   set price = 32600
 where category = 'almohadones'
   and price = 18300;

update public.products
   set price = 12900
 where slug in ('individuales-reversibles-celeste', 'individuales-reversibles-rosa')
   and price = 7200;

update public.products
   set price = 9700
 where slug = 'individuales-simple-pack-x2'
   and price = 5400;

-- 3. Envíos: envío gratis desde $50.000, "a coordinar" apagado y la opción
--    nueva entre "retiro" y "envio-a-coordinar" (solo si no está ya).
update public.store_settings
   set value = jsonb_set(
         jsonb_set(value, '{freeShippingFrom}', '50000'::jsonb),
         '{options}',
         (
           select jsonb_agg(elem order by ord)
             from (
               select case
                        when o ->> 'id' = 'envio-a-coordinar'
                          then o || '{"enabled": false}'::jsonb
                        else o
                      end as elem,
                      ord::numeric as ord
                 from jsonb_array_elements(value -> 'options') with ordinality as t(o, ord)
               union all
               select '{
                        "id": "envio-nacional",
                        "mode": "fijo",
                        "cost": 15000,
                        "label": "Envío a todo el país",
                        "detail": "Costo fijo, sin importar a dónde va · gratis desde $50.000",
                        "enabled": true
                      }'::jsonb,
                      coalesce(
                        (select ord from jsonb_array_elements(value -> 'options')
                                  with ordinality as r(o, ord)
                          where o ->> 'id' = 'retiro'),
                        0
                      ) + 0.5
                where not exists (
                  select 1 from jsonb_array_elements(value -> 'options') o
                   where o ->> 'id' = 'envio-nacional'
                )
             ) opciones
         )
       ),
       updated_at = now()
 where key = 'envios';

-- 4. Marquesina: la frase de envío vieja por la nueva, solo si sigue estando.
update public.store_settings
   set value = jsonb_set(
         value,
         '{marquee}',
         (
           select jsonb_agg(
                    case when m #>> '{}' = 'Envíos a todo el país'
                      then to_jsonb('Envío gratis desde $50.000'::text)
                      else m
                    end
                    order by ord
                  )
             from jsonb_array_elements(value -> 'marquee') with ordinality as t(m, ord)
         )
       ),
       updated_at = now()
 where key = 'marketing'
   and value -> 'marquee' @> '["Envíos a todo el país"]'::jsonb;
