# Contexto del proyecto

## Marca

- Nombre: DZ Estudio — `dz-estudio.com`, taller en Santa Fe Capital
- Rubro: objetos textiles maximalistas, hoy en dos líneas de producto
- Productos: almohadones (40 × 40 cm, pana estampada) e individuales (packs
  de 2, 30 × 42 cm, gabardina acrílica impermeable). Nada de manteles,
  servilletas, caminos de mesa ni mantas; los totes se pensaron y todavía no
  existen — no inventarlos.
- Público: adultos jóvenes (28-45) con gusto formado, dispuestos a pagar por diseño con criterio
- País: Argentina — precios en ARS. Hoy la tienda entrega de dos maneras:
  retiro en el depósito de Santa Fe Capital o envío a coordinar, que se cotiza
  por WhatsApp después de la compra. Andreani y Correo Argentino están
  cargados en el panel pero **apagados** hasta tener las tarifas reales, así
  que la tienda no muestra ningún precio de envío.
- Referencia estética: Coolhouse (thisiscoolhouse.com.ar) pero apuntando más adulto, más editorial y menos "hecho con IA"
- Personalidad: elegante, maximalista controlado, con ingenio seco — no cursi, no sobreactuada

## Stack técnico

- Framework: **React + Vite + TypeScript**
- Estilos: **Tailwind CSS**
- Base de datos y auth: **Supabase**
- Pasarela de pago: **Mercado Pago** (Argentina)
- Deploy: Vercel
- Analytics: Google Analytics 4 (`VITE_GA_ID`, cargado en Vercel) y el pixel
  de Meta (escrito en `src/lib/meta-pixel.ts`). Cada evento del embudo se mide
  en los dos desde `src/lib/analytics.ts`: las pantallas llaman a una sola
  función

## Sistema de diseño

### Paleta (variables CSS)

```css
--ink: #1A1A1A;      /* texto, bordes */
--cream: #F3EFE4;    /* fondo base papel */
--pink: #F26D9E;
--orange: #F26430;
--celeste: #8FC5E8;
--verde: #7CB562;
--lila: #B8A4E3;
--petroleo: #2F5D62;
--amarillo: #F4C542;
```

Reglas: cada sección/colección usa una **dupla bicolor** (rosa+naranja, celeste+verde, lila+petróleo, amarillo+tinta). Nunca más de 2 colores vibrantes en la misma pieza. Base siempre cream + ink.

**Color como texto:** los colores plenos no llegan al contraste AA sobre cream
ni blanco (rosa 2.45:1, naranja 2.75:1). Cuando un color de marca hace de
texto —el `em` de un titular, un error, un link, una etiqueta chica— va la
variante oscura `text-pink-ink`, `text-orange-ink`, `text-verde-ink`,
`text-lila-ink` o `text-celeste-ink` (`#A94C6F`, `#AB4622`, `#517640`,
`#755AAF`, `#337099`, definidas en `globals.css` con sus ratios). El color
pleno queda para fondos, bloques, badges y pills, y para texto sobre ink.
Sobre un bloque de color (la card celeste del newsletter) el texto va en ink.

### Tipografía (Google Fonts)

- **Lato** (400, 700, 900) — sans-serif para todo el contenido
- **Instrument Serif** (regular + italic) — serif italic para acentos y frases destacadas
- **DM Mono** (400, 500) — mono para etiquetas, precios, botones y badges (uppercase + tracking)

Regla de titular: sans bold + **una palabra clave en Instrument Serif italic en color contraste**.
Ejemplo: `Maximalismo, <em>editado</em>` donde `<em>` va en Instrument Serif italic + rosa o petróleo.

### Elementos gráficos signature

1. **Marquesina superior fija** — franja negra con texto DM Mono deslizándose horizontalmente. Separadores `✦` en rosa.
2. **Logo extendido** (`/logo-extendido.svg`, rosa) en navbar y footer; monogramas rosa/blanco como favicon según modo claro/oscuro.
3. El borde festoneado (`ScallopBorder.tsx`) y el damero quedan disponibles pero NO se usan en la UI — el estilo actual es limpio y flat.
4. El sello circular de edición limitada se descartó el 09/09/2026: no va a usarse, y el componente se borró. No volver a proponerlo.

### Componentes UI (estética limpia, referencia: rhodeskin.com / mosquiano.com)

- **Sin sombras duras y sin bordes gruesos.** Nada de box-shadows `4px 4px 0` ni bordes 2/2.5px ink. Superficies flat.
- **Botones primarios**: pill (rounded-full), fondo `ink`, texto `cream`, DM Mono 12px uppercase tracking-widest, sin borde ni sombra. Hover: `bg-ink/80`.
- **Botones secundarios**: pill transparente con borde 1px ink; hover invierte (fondo ink, texto cream).
- **Cards**: `rounded-2xl bg-white`, sin borde ni sombra, sobre el fondo cream.
- **Inputs**: borde 1px `ink/25`, radius 8px, fondo transparente; focus: borde ink (sin outline grueso).
- **Tags/badges**: pill con color de fondo pleno, sin borde, DM Mono uppercase 11px.
- **Divisores**: 1px `ink/10`–`ink/15`.
- **Drawers**: sin borde; separación con `shadow-2xl` suave.
- **Estilo general**: minimalismo cálido — mucho aire, tipografía como protagonista, color de marca en bloques planos.

## Tono de voz

**Sí (registro adulto, ingenio seco, concreto):**
- "Dos colores. Nunca cinco."
- "Los objetos lindos se usan. No se guardan esperando la ocasión."
- "Edición limitada. Cuando se van, se van."
- Frases que describen algo específico y real del producto o del proceso (un material, una regla de diseño, un detalle de uso), no eslóganes genéricos ni comparaciones forzadas con redes sociales.

**No:**
- Emojis faciales (usar solo símbolos ✦ ✧ ✿)
- Ganchos tipo "la mesa dice más de vos que tu Instagram" o "para quien no le teme a X" — fórmulas gastadas de copy genérico
- Personificar el objeto ("el almohadón que saluda", "no pide permiso") como recurso repetido en cada pieza
- "Amiga corré" / "es un LOOK" / "está IN"
- Formalismos: "adquiera nuestros exclusivos productos"
- CAPS agresivos y triples signos de exclamación
- Repetir el mismo slogan-eje en múltiples páginas (hero, footer, about) — variar la formulación aunque la idea de fondo sea la misma

## Estructura de páginas

1. **Home** — marquesina, hero grande, colecciones, novedades, valores, sobre la marca corto, newsletter, footer
2. **Tienda** — grid de productos con filtros (categoría, colección, color, precio)
3. **Producto** — galería + info + agregar al carrito + productos relacionados
4. **Carrito** — slide-over lateral con items, subtotal, ir al checkout
5. **Checkout** — formulario en pasos: contacto → envío → pago (MP + transferencia)
6. **Contacto** — form + Instagram + WhatsApp + email
7. **Pedido** — seguimiento de una orden por número y mail

Dos que no están en la navegación y no hay que dar por existentes:

- **Sobre nosotros** se borró el 08/09/2026 —contaba una historia que no es la
  de Mili— y hay que escribirla de cero antes de volver a linkearla.
- **FAQ** está oculta desde el 08/09/2026: el archivo sigue en `src/pages`,
  pero la ruta está comentada en `App.tsx` y en `lib/routes.ts` hasta que el
  texto se revise.

## Panel de administración (`/admin`)

Privado, fuera de la navegación de la tienda y con `noindex`. El acceso es
Supabase Auth + whitelist en la tabla `admins`; lo que protege los datos son las
policies de RLS que pasan por `public.is_admin()`, no el guard del front.

Secciones, en el orden del sidebar: Inicio (KPIs, gráficos, top productos,
últimas ventas) y Estadísticas (tráfico propio y conversión); Ventas y
Clientes; Productos, Precios y Centro de distribución (depósitos y stock);
Descuentos, Contenido y redes, y Marketing; Métodos de pago y Métodos de
envío.

- Layout propio (sidebar `ink`, contenido sobre `cream`), fuera de `StoreLayout`.
- Cada pantalla en su chunk lazy y **nunca** se precarga.
- La configuración editable vive en `store_settings` (una fila jsonb por
  sección) y la lee la tienda con `useStoreSettings`, siempre con fallback a las
  constantes del código.
- Puesta en marcha y qué está conectado de verdad: `PANEL-ADMIN.md`.

## Catálogo real

Seis productos, dos categorías. **La fuente de verdad es la tabla `products`
de Supabase**, que es la que edita el panel; `src/data/products.ts` es un
espejo que todavía usa la home (ver T1 en el backlog). Los precios de acá son
los del 09/09/2026 y cambian sin avisar: si importan, consultarlos.

Almohadones — 40 × 40 cm, pana estampada, 350 g, $18.300:

1. Almohadón Rombo Rosa — `almohadones-rombo-rosa` — rosa/naranja
2. Almohadón Rombo Celeste — `almohadones-rombo-celeste` — celeste
3. Almohadón Rayas Blanco y Negro — `almohadones-rayas-blanco-y-negro` — tinta/cream

Individuales — pack x2, 30 × 42 cm cada uno, gabardina acrílica impermeable, 400 g:

4. Individuales Reversibles Rosa — `individuales-reversibles-rosa` — rosa/celeste — $7.200
5. Individuales Reversibles Celeste — `individuales-reversibles-celeste` — celeste/naranja — $7.200
6. Individuales Rayas Blanco y Negro — `individuales-simple-pack-x2` — tinta/cream — $5.400

Cuidados, iguales en todos: lavar con agua fría, a ciclo suave o a mano, no
secar al sol.

**Promos vigentes** (`src/lib/promos.ts`, editables desde /admin/precios): 10%
pagando por transferencia, y 10% llevando 2 almohadones o 2 packs de
individuales —se cuentan por categoría y por separado, uno de cada uno no
alcanza—. Hasta 6 cuotas con tarjeta por Cuotas Simples, **con** interés: hoy
no hay cuotas sin interés y ningún texto puede prometerlas. Los cupones con
código (`/admin/descuentos`) se canjean en el resumen del checkout y no se
suman a las promos: se aplica el descuento mayor.

## Info de contacto

Todo esto vive en `src/lib/site.ts`, que es de donde lo lee el sitio.

- Email: milagrosdziuban@hotmail.com
- Instagram: [@dzestudio_](https://instagram.com/dzestudio_)
- WhatsApp: 342 529 9662
- Retiro: Tacuarí 7618, Guadalupe, Santa Fe Capital — lunes a viernes de 9 a 20
- Envíos: retiro en el depósito o envío a coordinar por WhatsApp. Andreani y
  Correo Argentino, apagados hasta tener las tarifas
- Pagos: Mercado Pago (tarjetas + efectivo) y transferencia bancaria

## Convenciones de código

- Componentes en `src/components/` con PascalCase
- Páginas en `src/pages/`
- Hooks custom en `src/hooks/` con prefijo `use`
- Utils en `src/lib/`
- Tipos TypeScript en `src/types/`
- Variables CSS en `src/styles/globals.css`
- Nombres de archivos: PascalCase para componentes, kebab-case para todo lo demás
- Un componente por archivo
- Usar `cn()` helper (clsx + tailwind-merge) para clases condicionales

## Prioridades

1. Diseño respetando el sistema al 100%
2. Responsive perfecto mobile-first
3. Performance: lazy loading de imágenes, code-splitting por página
4. Accesibilidad básica: contraste AA, focus visible, aria-labels en botones de ícono
5. SEO básico: meta tags dinámicos por página con react-helmet-async
