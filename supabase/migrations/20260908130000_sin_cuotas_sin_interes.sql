-- Las 3 cuotas sin interés salen de la tienda (08/09/2026).
--
-- Las absorbía la tienda y por ahora no se dan. El checkout sigue ofreciendo
-- hasta 6 cuotas, pero por Cuotas Simples, con el interés a cargo del cliente:
-- lo único que cambia es qué promete la tienda.
--
-- El front ya lo dice así (src/lib/promos.ts, con `sinInteres` en 0), pero los
-- textos guardados en store_settings le ganan al código, así que hay que
-- corregir las dos filas que todavía anuncian la promo.

update public.store_settings
set value = jsonb_set(
      jsonb_set(value, '{mercadopago,installments}', '0'::jsonb, true),
      '{mercadopago,installmentsLabel}',
      '"Hasta 6 cuotas con tarjeta"'::jsonb,
      true
    )
where key = 'pagos';

-- La marquesina guarda las frases ya escritas, no las arma: hay que cambiar la
-- línea que promete la promo y dejar las otras como están.
update public.store_settings
set value = jsonb_set(
      value,
      '{marquee}',
      (
        select jsonb_agg(
          case
            when item #>> '{}' ilike '%sin interés%'
              then '"Hasta 6 cuotas con tarjeta"'::jsonb
            else item
          end
          order by orden
        )
        from jsonb_array_elements(value -> 'marquee') with ordinality as t(item, orden)
      ),
      true
    )
where key = 'marketing'
  and jsonb_typeof(value -> 'marquee') = 'array'
  and jsonb_array_length(value -> 'marquee') > 0;
