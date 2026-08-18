# Edge Functions

Pasos para deployar (después de `npx supabase login` y `npx supabase link`).

## 1. Cargar los secretos

Los tokens y credenciales se guardan en Supabase, nunca en el código:

```powershell
npx supabase secrets set MP_ACCESS_TOKEN=TEST-xxxxxxxx-tu-token
npx supabase secrets set SITE_URL=http://localhost:5173
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya vienen
> inyectados automáticamente en las Edge Functions — no hace falta setearlos.

### Correo Argentino (cotización en vivo)

1. Creá una cuenta en [micorreo.correoargentino.com.ar](https://micorreo.correoargentino.com.ar)
   (es autogestionable, no hace falta acuerdo comercial).
2. Ahí te dan `customerId`, `userToken` y `passwordToken`. Cargalos:

```powershell
npx supabase secrets set CORREO_ARGENTINO_CUSTOMER_ID=tu-customer-id
npx supabase secrets set CORREO_ARGENTINO_USER_TOKEN=tu-user-token
npx supabase secrets set CORREO_ARGENTINO_PASSWORD_TOKEN=tu-password-token
npx supabase secrets set CORREO_ARGENTINO_ENV=test
```

Cambiá `CORREO_ARGENTINO_ENV` a `prod` cuando MiCorreo confirme que tu cuenta
está habilitada para producción. Sin estos tres secretos, `shipping-quote`
responde "no configurado" y el checkout usa el costo fijo de respaldo
cargado en **Panel → Métodos de envío** — no rompe nada, solo no cotiza.

### Andreani

Todavía no está conectada: su API no se autogestiona, las credenciales
(usuario, clave, código de cliente y contrato) las da el comercial de
cuenta de Andreani, no hay alta por autoservicio. Cuando las consigas, se
agrega un proveedor más en `shipping-quote/index.ts` con la misma lógica
que Correo Argentino — hasta entonces esas dos opciones quedan con costo
fijo en el panel.

## 2. Deployar las funciones

```powershell
npx supabase functions deploy create-preference
npx supabase functions deploy mp-webhook --no-verify-jwt
npx supabase functions deploy shipping-quote
```

`mp-webhook` va con `--no-verify-jwt` porque Mercado Pago llama sin el header
de autenticación de Supabase.

## 3. Probar

- `create-preference` y `shipping-quote` las llama el frontend con
  `supabase.functions.invoke`.
- `mp-webhook` la llama Mercado Pago. En modo test podés simular pagos con un
  usuario de prueba de MP.
- `shipping-quote` se puede probar sola:

```powershell
curl -X POST https://TU-PROYECTO.supabase.co/functions/v1/shipping-quote `
  -H "Authorization: Bearer TU_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{"destinationCp":"1425","weightGrams":700}'
```
