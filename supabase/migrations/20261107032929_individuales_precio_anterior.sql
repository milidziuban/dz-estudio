-- Los individuales vuelven al precio que tenían antes de bajar el 07/11/2026.
-- Lo pidió Mili. Almohadones, mantel y envío no cambian.
--
-- Cada UPDATE tiene de guarda el precio anterior, así que no pisa lo que se
-- haya cambiado desde el panel.

update public.products
   set price = 11600
 where slug in ('individuales-reversibles-celeste', 'individuales-reversibles-rosa')
   and price = 9300;

update public.products
   set price = 8700
 where slug in (
         'individuales-simple-pack-x2',
         'individuales-celeste-y-verde',
         'individuales-rayas-rosa-y-rojo'
       )
   and price = 7000;
