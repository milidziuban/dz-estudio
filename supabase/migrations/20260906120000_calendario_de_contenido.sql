-- ============================================================
-- DZ Estudio — Calendario de contenido (06/09/2026)
--
-- La pantalla /admin/contenido: qué se publica, qué día, a qué hora, con qué
-- foto y con qué texto. Es el espejo en la web de `06 Contenido/Calendario de
-- contenido.md` del vault — el vault sigue siendo la fuente de verdad de las
-- reglas; esta tabla es la agenda que se marca sola a medida que se publica.
--
--   · content_posts  → una fila por pieza (o por tarea de preparación)
--   · bucket contenido → las fotos que todavía no se subieron a Instagram
--
-- Pegar completo en Supabase → SQL Editor → Run.
-- Es idempotente: se puede correr dos veces sin duplicar nada.
-- ============================================================

-- ============================================================
-- 1. La tabla
-- ============================================================

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Clave estable de las piezas que vinieron del vault. Es lo que hace que
  -- correr la migración dos veces no duplique el calendario del lanzamiento.
  -- Las piezas creadas desde el panel van con ref null.
  ref text unique,

  -- Día y hora en la que se publica. Los horarios pensados son los dos picos
  -- de Instagram acá: mediodía (13-14 h) y noche (19-21 h).
  scheduled_at timestamptz not null,

  title text not null,

  -- La mezcla semanal recomendada en `06 Contenido/Reglas de contenido.md`:
  -- 2 de producto, 1 de proceso, 1 de uso, 1 de cercanía.
  kind text not null default 'producto' check (
    kind in ('producto', 'proceso', 'uso', 'cercania', 'cliente', 'promo', 'otro')
  ),

  -- 'tarea' no es una publicación: es la preparación que igual ocupa un día
  -- del calendario (archivar los posts de prueba, avisar por WhatsApp).
  format text not null default 'feed' check (
    format in ('feed', 'carrusel', 'reel', 'historia', 'tarea')
  ),

  channel text not null default 'instagram' check (
    channel in ('instagram', 'facebook', 'ambos')
  ),

  -- 'foto' = la foto ya está sacada pero falta el texto.
  -- 'listo' = foto y texto listos, solo queda subirlo.
  status text not null default 'idea' check (
    status in ('idea', 'foto', 'listo', 'publicado', 'pospuesto')
  ),

  -- Qué es la pieza: el guion, las tomas, la idea.
  brief text,
  -- El texto tal cual va a Instagram, listo para copiar y pegar.
  copy_text text,
  hashtags text,
  -- La foto o el video que hay que subir (bucket `contenido`).
  media_url text,

  -- El "Registro de lo publicado" del vault: qué pasó con la pieza.
  result text,
  published_at timestamptz
);

create index if not exists content_posts_scheduled_at_idx
  on public.content_posts (scheduled_at);

-- ============================================================
-- 2. Quién ve esto
--
-- Nada de esto es público: son las piezas ANTES de publicarse. Solo el admin,
-- y como en el resto del panel lo que lo protege es la RLS, no el front.
-- ============================================================

alter table public.content_posts enable row level security;

drop policy if exists "Admin gestiona el calendario" on public.content_posts;
create policy "Admin gestiona el calendario"
  on public.content_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 3. Storage para las fotos del calendario
--
-- Bucket aparte de `productos`: son fotos de trabajo, no fichas de catálogo,
-- y conviene poder borrarlas en bloque cuando el mes ya pasó.
-- Es público de lectura (el <img> del panel entra sin sesión), pero los
-- nombres llevan timestamp: no se adivinan. Igual, lo que se sube acá termina
-- publicado en Instagram de todos modos.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('contenido', 'contenido', true)
on conflict (id) do nothing;

drop policy if exists "Lectura pública de fotos de contenido" on storage.objects;
create policy "Lectura pública de fotos de contenido"
  on storage.objects for select
  using (bucket_id = 'contenido');

drop policy if exists "Admin sube fotos de contenido" on storage.objects;
create policy "Admin sube fotos de contenido"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'contenido' and public.is_admin());

drop policy if exists "Admin borra fotos de contenido" on storage.objects;
create policy "Admin borra fotos de contenido"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'contenido' and public.is_admin());

-- ============================================================
-- 4. La semana del lanzamiento, tal como está en el vault
--
-- Copiado de `06 Contenido/Calendario de contenido.md` y de
-- `06 Contenido/Guiones de historias.md` (versión del 05/09/2026).
-- Todas las horas son de Argentina (-03). Si algo cambia, se cambia en el
-- panel: esta carga es el punto de partida, no una copia que se sincroniza.
-- ============================================================

insert into public.content_posts
  (ref, scheduled_at, title, kind, format, channel, status, brief, copy_text)
values
  (
    'pre-07-archivar',
    timestamptz '2026-09-07 21:00-03',
    'Archivar los posts de prueba',
    'otro', 'tarea', 'instagram', 'idea',
    'Archivar, no borrar. Va antes de la primera historia de cuenta regresiva: el perfil tiene que estar limpio cuando alguien entre desde la historia.',
    null
  ),
  (
    'pre-07-historia',
    timestamptz '2026-09-07 21:30-03',
    'Historia — primera cuenta regresiva',
    'cercania', 'historia', 'instagram', 'idea',
    'Tres placas. Manos y voz en off, sin cara. Sticker de cuenta regresiva a jueves 10, 9 h, con el nombre "Abre la tienda". Sin link todavía.',
    $t$Placa 1 — video corto: las manos apilando las 31 unidades
En pantalla: Cosí 31.
Voz en off: Almohadones e individuales. Los cosí de a uno, acá, en los últimos meses.

Placa 2 — la mano pasando por la pana, primer plano
En pantalla: Pana estampada. 40 × 40. La funda se saca y se lava.
Voz en off: Esto es pana. La funda tiene solapa, se saca sin cierre ni botones, y el relleno va incluido.

Placa 3 — el almohadón en el sillón, quieto
En pantalla: El jueves 10 a las 9 abro la tienda.
Sticker: cuenta regresiva a jueves 10, 9 h — "Abre la tienda".$t$
  ),
  (
    'pre-08-ensayo',
    timestamptz '2026-09-08 21:00-03',
    'Ensayo general en el celular',
    'otro', 'tarea', 'instagram', 'idea',
    'Subir una pieza en borrador y mirarla en el feed desde el celular, como la va a ver cualquiera. Recortes, tipografía chica, colores.',
    null
  ),
  (
    'pre-09-historia',
    timestamptz '2026-09-09 20:00-03',
    'Historia — "mañana abro"',
    'cercania', 'historia', 'instagram', 'idea',
    'Cuatro placas. Sticker de cuenta regresiva otra vez (le queda menos de un día) y caja de preguntas: "Preguntame lo que quieras antes de mañana". Sin link hasta el jueves 11 h. Verificar stock y precios antes de subir.',
    $t$Placa 1 — el almohadón en el sillón
En pantalla: Mañana a las 9 abre.
Voz en off: Mañana a las nueve de la mañana se puede comprar.

Placa 2 — el scroll de dz-estudio.com grabado en el celular
En pantalla: Cada producto dice la tela, la medida y cómo se lava.
Voz en off: La tienda ya está armada. Cada producto dice de qué tela es, cuánto mide y cómo se lava. Envío a todo el país, o te lo llevo en mano si estás en la ciudad.

Placa 3 — las 31 unidades desplegadas
En pantalla: Rombo rosa: 3. Rayas: 3. Rombo celeste: 6.
Voz en off: Son series cortas. De cada estampa hice entre tres y seis.

Placa 4 — detalle de la tela, o la pila otra vez
En pantalla: Almohadón $18.300 · Individuales desde $5.400 el pack de dos.$t$
  ),
  (
    'pre-09-whatsapp',
    timestamptz '2026-09-09 20:30-03',
    'Avisar a mano por WhatsApp',
    'otro', 'tarea', 'instagram', 'idea',
    'Veinte o treinta personas, de a una, con un mensaje escrito para cada una. Justo después de subir la historia.',
    null
  ),
  (
    'lanz-1-carrusel',
    timestamptz '2026-09-10 09:00-03',
    '1. Carrusel de marca',
    'cercania', 'carrusel', 'ambos', 'idea',
    'Quién soy, qué hago, dónde se compra. La primera línea concreta, no "hola comunidad".',
    null
  ),
  (
    'lanz-historias-link',
    timestamptz '2026-09-10 11:00-03',
    'Historias con link a la tienda',
    'cercania', 'historia', 'instagram', 'idea',
    'Tres o cuatro historias: cara y manos, el link a la tienda, "preguntame lo que quieras". Es la primera vez que aparece el link.',
    null
  ),
  (
    'lanz-2-producto',
    timestamptz '2026-09-10 15:00-03',
    '2. Producto — almohadón rombo rosa',
    'producto', 'feed', 'ambos', 'idea',
    '40 × 40, pana, funda con solapa, relleno incluido. Quedan 3 y se dice.',
    null
  ),
  (
    'lanz-3-reel',
    timestamptz '2026-09-10 19:00-03',
    '3. Reel — "De la tela al sillón"',
    'proceso', 'reel', 'instagram', 'idea',
    'El rollo, la tijera, la máquina, el relleno entrando, el almohadón en el sillón. Sonido ambiente de la máquina, sin música. Texto en pantalla solo en la primera y la última toma.',
    null
  ),
  (
    'lanz-4-uso',
    timestamptz '2026-09-11 20:00-03',
    '4. Uso — "¿con qué combina?"',
    'uso', 'feed', 'ambos', 'idea',
    'El mismo almohadón sobre sillones de distinto color. Ataca el freno más resoluble: "no sé si va a combinar con lo que tengo".',
    null
  ),
  (
    'lanz-5-individuales',
    timestamptz '2026-09-12 11:00-03',
    '5. Producto — individuales rayas B&N',
    'producto', 'feed', 'ambos', 'idea',
    'La mesa puesta. Sábado a la mañana la gente está armando la mesa.',
    null
  ),
  (
    'lanz-domingo-historias',
    timestamptz '2026-09-13 20:00-03',
    'Historias — cómo fue la primera semana',
    'cercania', 'historia', 'instagram', 'idea',
    'Domingo sin feed a propósito. Solo historias: cara y manos, cómo fue la primera semana.',
    null
  ),
  (
    'lanz-6-reel',
    timestamptz '2026-09-14 19:30-03',
    '6. Reel — "cuánto tarda"',
    'proceso', 'reel', 'instagram', 'idea',
    'Los 90 minutos de un almohadón, con cronómetro en pantalla. Justifica el precio sin defenderlo.',
    null
  ),
  (
    'lanz-7-reversibles',
    timestamptz '2026-09-15 13:00-03',
    '7. Producto — individuales reversibles',
    'producto', 'feed', 'ambos', 'idea',
    'Dos individuales que son cuatro. Se dan vuelta y la mesa cambia.',
    null
  ),
  (
    'lanz-8-cercania',
    timestamptz '2026-09-16 19:00-03',
    '8. Cercanía',
    'cercania', 'feed', 'ambos', 'idea',
    'Una decisión del negocio contada en primera persona, o la pregunta "¿qué estampa querés que haga?".',
    null
  ),
  (
    'lanz-9-cierre',
    timestamptz '2026-09-17 19:00-03',
    '9. Cierre de semana',
    'cliente', 'feed', 'ambos', 'idea',
    'Lo que se vendió, lo que queda, y foto de cliente si ya hay. Si no, el pedido embalado saliendo.',
    null
  )
on conflict (ref) do nothing;
