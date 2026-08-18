-- ============================================================
-- DZ Estudio — Envío en vivo con Correo Argentino (19/08/2026)
--
-- Reemplaza los costos fijos de envío por cotización real donde ya se
-- puede: Correo Argentino cotiza en vivo por código postal (API de
-- MiCorreo, autogestionable). Andreani sigue con costo fijo hasta tener
-- credenciales de API — no son autogestionables, las da el comercial de
-- cuenta, y no hay forma de simularlas sin arriesgar cobrar mal un envío.
--
-- Cambios:
--   · products: peso_gramos (numérico, para calcular la tarifa real)
--   · store_settings.envios: origenCp, paquete estándar, y mode/provider/
--     service por opción; se agregan correo-sucursal y correo-domicilio
--   · orders: el constraint de shipping_method acepta los ids nuevos
--
-- Pegar completo en Supabase → SQL Editor → Run.
-- Es idempotente: se puede correr dos veces sin romper nada ni pisar
-- ediciones que ya hiciste en el panel (label, costo, habilitado).
-- ============================================================

-- 1. Peso real por producto, en gramos — lo que manda la cotización.
--    El "peso" de texto libre (ficha del producto) sigue igual, es
--    contenido para el cliente, no para calcular envío.
alter table public.products
  add column if not exists peso_gramos integer;

update public.products set peso_gramos = 350
 where slug in (
   'almohadones-rombo-rosa',
   'almohadones-rayas-blanco-y-negro',
   'almohadones-rombo-celeste'
 ) and peso_gramos is null;

update public.products set peso_gramos = 400
 where slug in (
   'individuales-doble-pack-x2',
   'individuales-simple-pack-x2'
 ) and peso_gramos is null;

-- 2. Métodos de envío nuevos
alter table public.orders
  drop constraint if exists orders_shipping_method_check;

alter table public.orders
  add constraint orders_shipping_method_check
  check (shipping_method in (
    'retiro',
    'andreani-sucursal', 'andreani-domicilio',
    'correo-sucursal', 'correo-domicilio'
  ));

-- 3. store_settings.envios
--    a) Le agrega mode/provider/service a las opciones que ya existen,
--       sin tocar label/costo/enabled si los editaste en el panel.
update public.store_settings
set value = jsonb_set(
  value,
  '{options}',
  (
    select jsonb_agg(
      case (o->>'id')
        when 'retiro' then o || '{"mode":"fijo"}'::jsonb
        when 'andreani-sucursal' then
          o || '{"mode":"fijo","provider":"andreani","service":"sucursal"}'::jsonb
        when 'andreani-domicilio' then
          o || '{"mode":"fijo","provider":"andreani","service":"domicilio"}'::jsonb
        else o
      end
    )
    from jsonb_array_elements(value -> 'options') o
  )
)
where key = 'envios';

--    b) Da de alta Correo Argentino a sucursal y a domicilio, en modo
--       "vivo" (cotización real vía la edge function shipping-quote).
--       El costo que queda cargado es el que se usa si la cotización
--       en vivo no está configurada todavía o falla.
update public.store_settings
set value = jsonb_set(
  value,
  '{options}',
  (value -> 'options') || jsonb_build_array(
    jsonb_build_object(
      'id', 'correo-sucursal',
      'label', 'Correo Argentino a sucursal',
      'detail', 'Cotización en vivo por código postal',
      'cost', 6500,
      'enabled', true,
      'mode', 'vivo',
      'provider', 'correo-argentino',
      'service', 'sucursal'
    ),
    jsonb_build_object(
      'id', 'correo-domicilio',
      'label', 'Correo Argentino a domicilio',
      'detail', 'Cotización en vivo por código postal',
      'cost', 8500,
      'enabled', true,
      'mode', 'vivo',
      'provider', 'correo-argentino',
      'service', 'domicilio'
    )
  )
)
where key = 'envios'
  and not exists (
    select 1 from jsonb_array_elements(value -> 'options') o
     where o ->> 'id' = 'correo-sucursal'
  );

--    c) Código postal de origen (depósito) y dimensiones del paquete
--       estándar en el que sale un pedido — no hace falta cargar medidas
--       por producto, son objetos textiles blandos que van en el mismo
--       tipo de paquete.
update public.store_settings
set value = value
  || jsonb_build_object(
       'origenCp', coalesce(value ->> 'origenCp', '3000')
     )
  || jsonb_build_object(
       'paquete', coalesce(
         value -> 'paquete',
         '{"largoCm":40,"anchoCm":30,"altoCm":10}'::jsonb
       )
     )
where key = 'envios';
