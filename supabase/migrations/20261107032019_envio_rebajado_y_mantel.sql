-- El envío gratis pasa a ser envío rebajado, y el mantel gana lo mismo que el
-- resto (07/11/2026).
--
-- Corrige `envio_7500_sin_gratis`: lo que Mili pidió fue cambiar el envío
-- GRATIS por uno de $7.500, no bajar el envío de todos.
--
-- - Debajo de $50.000 de subtotal (antes de descuentos), $15.000 como antes.
-- - Desde $50.000, $7.500 (`envios.costoRebajado`) en vez de cero. Con 0 sigue
--   siendo gratis. El retiro sigue sin cargo: se toma el menor de los dos.
-- - Mantel: margen de 80% como el resto (27.486 × 1,8 ÷ 0,7 = $70.700).
--
-- ORDEN: se corre DESPUÉS de desplegar el código. El front viejo mostraría
-- "Gratis" desde $50.000 mientras esta función cobra $7.500.

-- 1. La regla de cobro. Se reemplazan solo los dos pedazos que cambian, y si
--    alguno no está tal cual, la migración frena en vez de seguir de largo.
do $migracion$
declare
  v_def text := pg_get_functiondef('public.recalculate_order_totals'::regproc);
  v_viejo_1 text := $a$  if v_free_from is not null and v_subtotal >= v_free_from then
    v_shipping_cost := 0;
  elsif coalesce(v_option ->> 'mode', 'fijo') = 'a-coordinar' then$a$;
  v_nuevo_1 text := $a$  if coalesce(v_option ->> 'mode', 'fijo') = 'a-coordinar' then$a$;
  v_viejo_2 text := $a$  -- El cupón de envío gratis pone el envío en cero, sea cual sea el método.$a$;
  v_nuevo_2 text := $a$  -- Desde el monto del panel el envío baja a `costoRebajado` (0 = gratis): el
  -- menor de los dos, para que el retiro y "a coordinar" sigan en cero. Se mide
  -- sobre el subtotal antes de descuentos.
  if v_free_from is not null and v_subtotal >= v_free_from then
    v_shipping_cost := least(
      v_shipping_cost,
      coalesce(nullif(v_envios ->> 'costoRebajado', '')::integer, 0)
    );
  end if;

  -- El cupón de envío gratis pone el envío en cero, sea cual sea el método.$a$;
begin
  if position(v_viejo_1 in v_def) = 0 or position(v_viejo_2 in v_def) = 0 then
    raise exception 'recalculate_order_totals no es la esperada: revisar a mano';
  end if;
  execute replace(replace(v_def, v_viejo_1, v_nuevo_1), v_viejo_2, v_nuevo_2);
end
$migracion$;

-- 2. Envíos: $15.000 fijos, y $7.500 desde $50.000.
update public.store_settings
   set value = jsonb_set(
         value || '{"freeShippingFrom": 50000, "costoRebajado": 7500}'::jsonb,
         '{options}',
         (
           select jsonb_agg(
                    case
                      when o ->> 'id' = 'envio-nacional'
                        then o || '{"cost": 15000, "detail": "Costo fijo, sin importar a dónde va · a $7.500 desde $50.000"}'::jsonb
                      else o
                    end
                    order by ord
                  )
             from jsonb_array_elements(value -> 'options') with ordinality as t(o, ord)
         )
       ),
       updated_at = now()
 where key = 'envios';

-- 3. Marquesina: la frase de envío por la nueva, solo si sigue estando.
update public.store_settings
   set value = jsonb_set(
         value,
         '{marquee}',
         (
           select jsonb_agg(
                    case when m #>> '{}' = 'Envío a todo el país a $7.500'
                      then to_jsonb('Envío a $7.500 desde $50.000'::text)
                      else m
                    end
                    order by ord
                  )
             from jsonb_array_elements(value -> 'marquee') with ordinality as t(m, ord)
         )
       ),
       updated_at = now()
 where key = 'marketing'
   and value -> 'marquee' @> '["Envío a todo el país a $7.500"]'::jsonb;

-- 4. Mantel, con la guarda del precio anterior.
update public.products
   set price = 70700
 where slug = 'mantel-rayas-rosa-y-rojo-mediano'
   and price = 62900;
