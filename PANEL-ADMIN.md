# Panel de administración — puesta en marcha

El panel vive en `/admin` del mismo sitio. No está linkeado desde ninguna parte
de la tienda, está fuera de Google (`robots.txt` + `noindex`) y solo entra quien
esté en la tabla `admins` de Supabase.

## 1. Correr la migración

Supabase → SQL Editor → pegar completo y Run:

```
supabase/migrations/20260818120000_panel_admin.sql
```

Crea la tabla `admins`, la función `is_admin()`, las policies de escritura y las
tablas nuevas (`page_views`, `discounts`, `store_settings`,
`newsletter_subscribers`) más el bucket de Storage `productos`.

Es idempotente: se puede correr dos veces sin romper nada.

## 2. Crear tu usuario

Supabase → **Authentication → Users → Add user → Create new user**

- Email: el que vas a usar para entrar
- Password: la que elijas
- Marcá **Auto Confirm User**

## 3. Darte permiso de admin

De vuelta en el SQL Editor, con tu email:

```sql
insert into public.admins (user_id, email, nombre)
select id, email, 'Milagros'
  from auth.users
 where email = 'TU-EMAIL@ejemplo.com'
on conflict (user_id) do nothing;
```

Verificá que quedó una sola fila:

```sql
select email, created_at from public.admins;
```

## 4. Cerrar la puerta de atrás

Supabase → **Authentication → Sign In / Providers**.

⚠️ Hay dos toggles parecidos y solo uno es el que va:

| Toggle | Qué hace | Cómo tiene que quedar |
|---|---|---|
| **Enable email provider** | Habilita el login con email y contraseña | **prendido** |
| **Allow new users to sign up** (a veces "Enable user signups") | Permite que cualquiera se registre solo | **apagado** |

Si apagás el primero, **tampoco podés entrar vos**: el login tira
*"Email logins are disabled"*.

Apagar el segundo es prolijidad, no la cerradura: el panel no se abre por tener
cuenta, se abre por estar en la tabla `admins`. Quien se registre por su cuenta
choca igual contra la pantalla de "esta cuenta no es administradora".

## 5. Entrar

`https://www.dz-estudio.com/admin` (o `http://localhost:5173/admin` en
desarrollo).

---

## Cómo está protegido

El guard del front (`RequireAdmin`) decide qué se dibuja, pero **no es la
seguridad**: lo que protege los datos son las policies de RLS de Postgres. Todas
las de escritura y las lecturas privadas pasan por `public.is_admin()`, que
chequea `auth.uid()` contra la tabla `admins`. Sin esa fila, las queries vuelven
vacías o con error aunque alguien fuerce el render de las pantallas.

Qué queda público a propósito:

| Tabla | Público | Admin |
|---|---|---|
| `products` | lectura | lectura + escritura |
| `orders` | insert (el checkout) | lectura + edición |
| `store_settings` | lectura (costos de envío, datos bancarios) | escritura |
| `discounts` | lectura solo de los vigentes | todo |
| `page_views` | insert | lectura |
| `newsletter_subscribers` | insert | todo |
| Storage `productos` | lectura | subir / borrar |

Los `insert` públicos son necesarios (el visitante no está logueado) y por eso
los números de visitas son orientativos: alguien con la anon key podría
inflarlos.

## Qué controla el panel de la tienda de verdad

Estos cambios se ven en el sitio sin deploy:

- **Productos**: precio, stock, fichas, fotos, variantes, prender y apagar.
- **Métodos de envío**: nombre, aclaración, costo, cuáles se ofrecen y desde qué
  monto el envío es gratis. El checkout los lee de `store_settings`.
- **Métodos de pago**: banco, titular, CUIT, CBU y alias de la transferencia.
- **Descuentos → promociones automáticas**: los porcentajes y el mínimo de las
  dos promos que se aplican solas en el carrito.
- **Marketing → marquesina**: las frases de la franja negra.
- **Centro de distribución**: dirección y horario del punto de retiro, umbral de
  poco stock.

Lo que todavía **no** está conectado, y hay que tenerlo presente:

- **Cupones con código**: se crean y administran en el panel, pero el checkout
  no tiene el campo para canjearlos. Por ahora sirven para tenerlos definidos.
- **Instagram / WhatsApp / email del footer**: se guardan en el panel, pero el
  footer y la página de contacto los siguen tomando de `src/lib/site.ts`.
- **Stock**: se ve y se edita, pero una venta no lo descuenta sola. El descuento
  automático necesitaría hacerse del lado del servidor (en el webhook de
  Mercado Pago), no desde el navegador.
- **Visitas**: se cuentan desde que se corre la migración. GA4 sigue midiendo
  aparte y con más detalle.

## Estructura

```
src/pages/admin/          Inicio, Estadisticas, Productos, Ventas, Clientes,
                          Descuentos, Marketing, MetodosPago, MetodosEnvio,
                          Distribucion, Login
src/components/admin/     Layout, sidebar, tablas, drawers, gráfico, guard
src/hooks/                useAdminAuth, useAdminOrders, useAdminProducts,
                          useDiscounts, useSubscribers, useStoreSettings,
                          useVisits
src/lib/admin.ts          Formato, rangos de fecha, export CSV
src/lib/admin-stats.ts    KPIs, series del gráfico, clientes, tráfico
src/lib/visits.ts         Registro de visitas propio
```

Cada pantalla del panel baja en su propio chunk y nunca se precarga: el
visitante de la tienda no descarga nada de esto.
