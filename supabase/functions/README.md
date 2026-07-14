# Edge Functions — Mercado Pago

Pasos para deployar (después de `npx supabase login` y `npx supabase link`).

## 1. Cargar los secretos

El token de test de Mercado Pago se guarda en Supabase, nunca en el código:

```powershell
npx supabase secrets set MP_ACCESS_TOKEN=TEST-xxxxxxxx-tu-token
npx supabase secrets set SITE_URL=http://localhost:5173
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya vienen
> inyectados automáticamente en las Edge Functions — no hace falta setearlos.

## 2. Deployar las funciones

```powershell
npx supabase functions deploy create-preference
npx supabase functions deploy mp-webhook --no-verify-jwt
```

`mp-webhook` va con `--no-verify-jwt` porque Mercado Pago llama sin el header
de autenticación de Supabase.

## 3. Probar

- `create-preference` la llama el frontend con `supabase.functions.invoke`.
- `mp-webhook` la llama Mercado Pago. En modo test podés simular pagos con un
  usuario de prueba de MP.
