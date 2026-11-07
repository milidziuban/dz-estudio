-- Envío a $7.500 fijos, sin envío gratis, y precios más bajos (07/11/2026).
--
-- - "envio-nacional" pasa de $15.000 a $7.500 y se saca el envío gratis desde
--   $50.000. El envío real sigue saliendo ~$22.000: lo que la clienta no paga
--   lo pone la tienda.
-- - El envío dentro del precio baja del 44% al 30%: costo × 1,8 ÷ 0,7,
--   redondeado hacia arriba a $100. El mantel mantiene su margen de 60%.
--
-- Idempotente: cada UPDATE de precio tiene de guarda el precio anterior, así
-- que no pisa lo que se haya cambiado desde el panel.

-- 1. Precios.
update public.products
   set price = 23500
 where category = 'almohadones'
   and price = 29300;

update public.products
   set price = 9300
 where slug in ('individuales-reversibles-celeste', 'individuales-reversibles-rosa')
   and price = 11600;

update public.products
   set price = 7000
 where slug in (
         'individuales-simple-pack-x2',
         'individuales-celeste-y-verde',
         'individuales-rayas-rosa-y-rojo'
       )
   and price = 8700;

update public.products
   set price = 62900
 where slug = 'mantel-rayas-rosa-y-rojo-mediano'
   and price = 78500;

-- 2. Envíos: $7.500 fijos y sin envío gratis.
update public.store_settings
   set value = jsonb_set(
         jsonb_set(value, '{freeShippingFrom}', 'null'::jsonb),
         '{options}',
         (
           select jsonb_agg(
                    case
                      when o ->> 'id' = 'envio-nacional'
                        then o || '{"cost": 7500, "detail": "Costo fijo, sin importar a dónde va"}'::jsonb
                      else o
                    end
                    order by ord
                  )
             from jsonb_array_elements(value -> 'options') with ordinality as t(o, ord)
         )
       ),
       updated_at = now()
 where key = 'envios';

-- 3. La parte del precio que ayuda a pagar el envío, para /admin/precios.
update public.store_settings
   set value = value || '{"envioEnPrecioPercent": 30}'::jsonb,
       updated_at = now()
 where key = 'precios';

-- 4. Marquesina: la frase de envío gratis por la nueva, solo si sigue estando.
update public.store_settings
   set value = jsonb_set(
         value,
         '{marquee}',
         (
           select jsonb_agg(
                    case when m #>> '{}' = 'Envío gratis desde $50.000'
                      then to_jsonb('Envío a todo el país a $7.500'::text)
                      else m
                    end
                    order by ord
                  )
             from jsonb_array_elements(value -> 'marquee') with ordinality as t(m, ord)
         )
       ),
       updated_at = now()
 where key = 'marketing'
   and value -> 'marquee' @> '["Envío gratis desde $50.000"]'::jsonb;
