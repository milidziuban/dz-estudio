-- ============================================================
-- Los cupones dejan de ser de lectura pública (R18)
--
-- La policy "Lectura pública de cupones vigentes" dejaba que cualquiera con
-- la clave pública pidiera `select * from discounts` y se llevara la lista
-- entera de códigos activos —con su valor y su mínimo— antes de que se
-- publicaran. Hoy la tabla está vacía, así que no se filtró nada; el día que
-- el checkout tenga campo de cupón (M3) sí importaría.
--
-- En lugar de leer la tabla, la tienda pregunta por UN código: la función
-- devuelve el cupón solo si existe y está vigente, y nada si no. Sin
-- listado no hay enumeración posible: hay que adivinar el código.
--
-- Cuando se haga M3, el checkout valida así:
--   supabase.rpc("cupon_vigente", { p_code: codigo })
-- y descuenta a partir de `kind`, `value` y `min_subtotal`. La tabla sigue
-- siendo del panel: leerla o editarla pide sesión de admin.
-- ============================================================

drop policy if exists "Lectura pública de cupones vigentes" on public.discounts;

create or replace function public.cupon_vigente(p_code text)
returns table (
  code text,
  description text,
  kind text,
  value integer,
  min_subtotal integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select d.code, d.description, d.kind, d.value, d.min_subtotal
  from public.discounts d
  where trim(coalesce(p_code, '')) <> ''
    and upper(d.code) = upper(trim(p_code))
    and d.active
    and (d.starts_at is null or d.starts_at <= now())
    and (d.ends_at is null or d.ends_at >= now())
    and (d.max_uses is null or d.uses < d.max_uses)
  limit 1;
$$;

comment on function public.cupon_vigente(text) is
  'Valida un código de cupón sin exponer la tabla. Devuelve una fila si el cupón existe y está vigente, y ninguna si no.';

revoke all on function public.cupon_vigente(text) from public;
grant execute on function public.cupon_vigente(text) to anon, authenticated;
