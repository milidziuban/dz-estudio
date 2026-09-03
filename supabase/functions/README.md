# Edge Functions

Pasos para deployar (después de `npx supabase login` y `npx supabase link`).

## 1. Cargar los secretos

Los tokens y credenciales se guardan en Supabase, nunca en el código:

```powershell
npx supabase secrets set MP_ACCESS_TOKEN=TEST-xxxxxxxx-tu-token
npx supabase secrets set SITE_URL=http://localhost:5173
```

### Pasar Mercado Pago de prueba a producción

El modo (test o real) lo define únicamente el valor de `MP_ACCESS_TOKEN`, no hay
nada más hardcodeado. Para pasar a producción:

1. En tu cuenta real de Mercado Pago (no la de prueba): *Tu negocio →
   Configuración → Credenciales de producción* y copiá el Access Token
   (empieza con `APP_USR-`, no con `TEST-`).
2. Reemplazá el secreto:

```powershell
npx supabase secrets set MP_ACCESS_TOKEN=APP_USR-tu-token-de-produccion
npx supabase secrets set SITE_URL=https://tu-dominio-real.com
```

`SITE_URL` tiene que ser https: el `auto_return` (volver solo a la tienda
después de pagar) solo se activa si la back_url no es localhost/http. No
hace falta redeployar las funciones, los secretos se aplican al instante.

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya vienen
> inyectados automáticamente en las Edge Functions — no hace falta setearlos.

### Correo Argentino (cotización en vivo)

1. Registrate en [micorreo.correoargentino.com.ar](https://micorreo.correoargentino.com.ar/MiCorreo/public/mi-correo)
   con tus datos (DNI o CUIT, email, teléfono).
2. El registro del sitio no da las credenciales de API solas: hay que pedirlas
   aparte con el [formulario de contacto de Correo Argentino](https://www.correoargentino.com.ar/MiCorreo/public/contact)
   (o llamando al 0810-777-7787 / (011) 4891-9191, lunes a viernes 8 a 20hs).
   Te dan un `customerId`, `userToken` y `passwordToken` — un juego para TEST
   y otro distinto para PROD, hay que pedirlos por separado. Cargá primero
   los de TEST:

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

### Resend (los mails del pedido)

La tienda manda tres mails: **falta la transferencia**, **pago confirmado** y
**despachado / listo para retirar**. Los arma `order-email` leyendo la orden de
la base, no del navegador.

**1. Verificar el dominio.** Resend no deja mandar desde un Hotmail ni desde un
Gmail: hay que probar que el dominio es tuyo. En Resend → *Domains* → *Add
domain* → `dz-estudio.com`. Te da tres o cuatro registros DNS (un `MX`, un `TXT`
de SPF y un `TXT` de DKIM).

El DNS de `dz-estudio.com` está en **Cloudflare**, así que los registros van en
Cloudflare → el dominio → *DNS* → *Add record*, copiando nombre y valor tal cual.
Importante: en los registros que Resend pide, la nubecita naranja (*Proxy*) va
apagada — **DNS only**. Tardan entre minutos y un par de horas en verificarse.

**2. Cargar los secretos.** La API key sale de Resend → *API Keys* → *Create*:

```powershell
npx supabase secrets set RESEND_API_KEY=re_tu_api_key
npx supabase secrets set RESEND_FROM="DZ Estudio <pedidos@dz-estudio.com>"
npx supabase secrets set RESEND_REPLY_TO=milagrosdziuban@hotmail.com
```

`RESEND_FROM` tiene que usar el dominio verificado en el paso 1.
`RESEND_REPLY_TO` es opcional: es a dónde llegan las respuestas de las clientas
(si no lo cargás, responden a la casilla del `from`).

> Sin `RESEND_API_KEY`, `order-email` contesta `skipped` y no rompe nada: la
> compra se guarda igual, solo no sale el mail. Sirve para probar el checkout
> antes de tener el dominio verificado.

**3. Que no se manden dos veces.** La tabla `order_emails` guarda qué mail salió
para qué pedido, con clave primaria `(order_id, kind)`. Mercado Pago reintenta la
misma notificación varias veces y el panel se puede guardar dos veces: el segundo
intento encuentra la fila y no manda nada. Si Resend falla, la fila se borra sola
para que el reintento sí salga. Para reenviar un mail a mano, borrá su fila:

```sql
delete from order_emails where order_id = '...' and kind = 'pago-confirmado';
```

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
npx supabase functions deploy order-email
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
