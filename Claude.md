# Contexto del proyecto

## Marca

- Nombre: [NOMBRE DE LA MARCA]
- Rubro: objetos textiles maximalistas, por el momento en tres líneas de producto
- Productos: almohadones, individuales y bolsos tipo tote bag (nada de manteles, servilletas, caminos de mesa ni mantas)
- Público: adultos jóvenes (28-45) con gusto formado, dispuestos a pagar por diseño con criterio
- País: Argentina — precios en ARS, envíos nacionales
- Referencia estética: Coolhouse (thisiscoolhouse.com.ar) pero apuntando más adulto, más editorial y menos "hecho con IA"
- Personalidad: elegante, maximalista controlado, con ingenio seco — no cursi, no sobreactuada

## Stack técnico

- Framework: **React + Vite + TypeScript**
- Estilos: **Tailwind CSS**
- Base de datos y auth: **Supabase**
- Pasarela de pago: **Mercado Pago** (Argentina)
- Deploy: Vercel
- Analytics: Google Analytics 4 (dejar el ID configurable)

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

### Tipografía (Google Fonts)

- **Lato** (400, 700, 900) — sans-serif para todo el contenido
- **Instrument Serif** (regular + italic) — serif italic para acentos y frases destacadas
- **DM Mono** (400, 500) — mono para etiquetas, precios, botones y badges (uppercase + tracking)

Regla de titular: sans bold + **una palabra clave en Instrument Serif italic en color contraste**.
Ejemplo: `Maximalismo, <em>editado</em>` donde `<em>` va en Instrument Serif italic + rosa o petróleo.

### Elementos gráficos signature

1. **Marquesina superior fija** — franja negra con texto DM Mono deslizándose horizontalmente. Separadores `✦` en rosa.
2. **Sello editorial circular** — badge redondo amarillo (sin borde) con "edición limitada" en Instrument Serif italic + número en DM Mono.
3. **Logo extendido** (`/logo-extendido.svg`, rosa) en navbar y footer; monogramas rosa/blanco como favicon según modo claro/oscuro.
4. El borde festoneado (`ScallopBorder.tsx`) y el damero quedan disponibles pero NO se usan en la UI — el estilo actual es limpio y flat.

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
6. **Sobre nosotros** — página editorial con historia y filosofía
7. **FAQ** — acordeón con envíos, cambios, cuidados, mayoristas
8. **Contacto** — form + Instagram + WhatsApp + email

## Productos de ejemplo (para poblar la base)

Individuales:
1. Individual "Positano" set x2 — $18.000 — celeste/verde
2. Individual "Verano" set x4 — $32.000 — amarillo/tinta

Almohadones:
3. Almohadón "Hola casa" 45x45 — $22.000 — naranja
4. Almohadón "Grid" 45x45 — $22.000 — damero petróleo/cream
5. Almohadón "Bordado" 50x30 — $26.000 — lila
6. Almohadón "Circular" 40cm redondo — $24.000 — celeste
7. Almohadón "Editorial" set x2 — $38.000 — rosa/amarillo

Bolsos:
8. Tote "Domingo" — $34.000 — rayas verde/cream
9. Tote "Nocturna" — $36.000 — petróleo/rosa
10. Tote "Mercado" — $30.000 — amarillo/petróleo

Cada producto: 2-3 fotos placeholder, descripción, medidas, material, cuidados, número de edición limitada.

## Info de contacto

- Email: [TU EMAIL]
- Instagram: [TU INSTAGRAM]
- Envíos: Andreani y Correo Argentino a todo el país
- Pagos: Mercado Pago (tarjetas + efectivo) + transferencia bancaria

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
