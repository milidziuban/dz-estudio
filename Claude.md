# Contexto del proyecto

## Marca

- Nombre: [NOMBRE DE LA MARCA]
- Rubro: textiles maximalistas y elegantes para mesa y living
- Productos: individuales, manteles, servilletas, caminos de mesa, almohadones, mantas
- Público: adultos jóvenes (28-45) con gusto formado, dispuestos a pagar por diseño con actitud
- País: Argentina — precios en ARS, envíos nacionales
- Referencia estética: Coolhouse (thisiscoolhouse.com.ar) pero apuntando más adulto y con más humor editorial
- Personalidad: elegante, maximalista controlado, cercana pero no cursi, con actitud e ingenio

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

- **Bricolage Grotesque** (400, 600, 700, 800) — sans-serif para todo el contenido
- **Instrument Serif** (regular + italic) — serif italic para acentos y frases destacadas
- **DM Mono** (400, 500) — mono para etiquetas, precios, badges (uppercase)

Regla de titular: sans chunky + **una palabra clave en Instrument Serif italic en color contraste**.
Ejemplo: `Textiles con <em>carácter</em>` donde `<em>` va en Instrument Serif italic + rosa o petróleo.

### Elementos gráficos signature

1. **Borde festoneado (scallop)** — es la firma de la marca. SVG escalable. Aparece en cards de producto, banners, separadores y hangtags.
2. **Marquesina superior fija** — franja negra con texto DM Mono deslizándose horizontalmente. Separadores `✦` en rosa.
3. **Damero clásico** — como acento secundario en algunos backgrounds.
4. **Sello editorial circular** — badge redondo estilo timbre con "edición limitada" en Instrument Serif italic + número en DM Mono.

### Componentes UI

- **Botones primarios**: fondo `ink`, texto `cream`, borde 2.5px ink, radius 100px, box-shadow duro `4px 4px 0 var(--ink)`. Hover: se levanta 2px.
- **Botones secundarios**: fondo `cream`, texto `ink`, borde 2.5px ink.
- **Cards**: borde 2.5px ink, radius 14px, box-shadow duro `6px 6px 0 var(--ink)`, fondo cream.
- **Inputs**: borde 2px ink, radius 8px, fondo cream, focus con outline en color vibrante.
- **Tags/badges**: pill (radius 100px), borde 2px ink, colores rotativos, DM Mono uppercase 11px.
- **Estilo general**: neobrutalismo elegante — bordes duros, shadows sin blur, mucho aire entre elementos.

## Tono de voz

**Sí (registro adulto con humor):**
- "La mesa dice más de vos que tu Instagram."
- "Para quien no le teme al color, ni a la lavandería."
- "Textiles que se ven mejor con la comida encima."
- "Edición limitada. Cuando se van, se van."

**No:**
- Emojis faciales (usar solo símbolos ✦ ✧ ✿)
- "Amiga corré" / "es un LOOK" / "está IN"
- Formalismos: "adquiera nuestros exclusivos productos"
- CAPS agresivos y triples signos de exclamación

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

Mesa:
1. Individual "Positano" set x2 — $18.000 — celeste/verde
2. Mantel "Fiesta" 200x150 — $42.000 — rosa/naranja
3. Servilletas "Domingo" set x4 — $12.000 — amarillo/petróleo
4. Camino de mesa "Larga sobremesa" — $24.000 — rayas lila/petróleo
5. Individual "Verano" set x4 — $32.000 — amarillo/tinta

Living:
6. Almohadón "Hola casa" 45x45 — $22.000 — naranja
7. Almohadón "Grid" 45x45 — $22.000 — damero petróleo/cream
8. Almohadón "Bordado" 50x30 — $26.000 — lila
9. Manta "Domingo largo" — $58.000 — rayas verde/cream
10. Almohadón "Circular" 40cm redondo — $24.000 — celeste
11. Almohadón "Editorial" set x2 — $38.000 — rosa/amarillo
12. Manta "Nocturna" — $62.000 — petróleo/rosa

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
