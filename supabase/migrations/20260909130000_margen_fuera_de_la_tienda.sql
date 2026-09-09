-- ============================================================
-- El margen tampoco viaja al navegador — 09/09/2026
--
-- Sacar `cost` de la lectura pública (migración anterior) no alcanzaba: la
-- fila `precios` de `store_settings` es de lectura pública y trae
-- `marginPercent`. Con el precio a la vista, el costo se despeja de memoria.
-- Era exactamente el dato que la revisión quería tapar.
--
-- La tienda lee cuatro de las cinco filas: `pagos` (datos de transferencia),
-- `marketing` (promos), `envios` (opciones y costos) y `distribucion` (el
-- punto de retiro que muestra el checkout). `precios` es solo de
-- /admin/precios, así que sale de la lectura pública.
--
-- El panel la sigue leyendo por la policy "Admin edita configuración", que es
-- `for all` sobre `authenticated` con `is_admin()`.
-- ============================================================

drop policy if exists "Lectura pública de configuración" on public.store_settings;
create policy "Lectura pública de configuración"
  on public.store_settings for select
  to anon
  using (key in ('pagos', 'marketing', 'envios', 'distribucion'));
