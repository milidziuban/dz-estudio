/**
 * Genera dist/sitemap.xml con las páginas fijas + una entrada por producto.
 *
 * Por qué existe: hasta ahora el sitemap era un archivo escrito a mano en
 * public/, así que dar de alta un producto en el panel y no acordarse de
 * agregar su URL acá dejaba la ficha fuera de Google, en silencio y sin que
 * nada avisara. Ahora la lista de productos sale de la misma base que la
 * tienda.
 *
 * Corre después de `vite build` (ver el script "build" del package.json) y
 * escribe directo en dist/, encima de lo que haya copiado Vite.
 *
 * El sitemap es un archivo de producción: en `npm run dev` no existe, y no
 * hace falta. Se puede correr solo, para mirar qué va a publicar:
 *     node scripts/generate-sitemap.mjs
 *
 * Ojo con lo que esto NO arregla: el sitemap se rearma en cada deploy, no en
 * cada alta. Un producto cargado en el panel entra al sitemap recién con el
 * siguiente deploy. Hoy no es un problema real porque las fotos viven en
 * public/productos: un producto nuevo necesita un deploy igual, para que su
 * foto exista.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(root, "dist/sitemap.xml");

/** Las páginas que no salen de la base. `changefreq` y `priority` son una
 *  sugerencia: Google las ignora hace años, pero no molestan y dejan escrito
 *  qué esperamos que se mire seguido. */
const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/tienda", changefreq: "daily", priority: "0.9" },
  { path: "/sobre-nosotros", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/contacto", changefreq: "monthly", priority: "0.5" },
];

/** Vite lee el .env solo; este script es Node pelado y tiene que leerlo él.
 *  En Vercel las variables ya vienen en el entorno y el archivo no existe. */
function loadEnv() {
  const file = resolve(root, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] === undefined) {
      process.env[key] = raw.trim().replace(/^["']|["']$/g, "");
    }
  }
}

async function slugsFromSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("faltan VITE_SUPABASE_URL / ANON_KEY");

  const res = await fetch(`${url}/rest/v1/products?select=slug&order=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Supabase respondió ${res.status}`);

  const rows = await res.json();
  const slugs = rows.map((row) => row.slug).filter(Boolean);
  if (!slugs.length) throw new Error("la tabla products vino vacía");
  return slugs;
}

/** Respaldo: el catálogo espejo de src/data/products.ts, el mismo que muestra
 *  la tienda cuando Supabase no contesta. Se lee con una expresión regular
 *  para no depender de compilar TypeScript en el build. */
function slugsFromMirror() {
  const source = readFileSync(resolve(root, "src/data/products.ts"), "utf8");
  const slugs = [...source.matchAll(/\bslug:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (!slugs.length) throw new Error("no encontré slugs en el catálogo espejo");
  return [...new Set(slugs)];
}

const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildXml(baseUrl, pages) {
  const entries = pages
    .map(({ path, changefreq, priority }) =>
      [
        "  <url>",
        `    <loc>${escape(baseUrl + path)}</loc>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<!--",
    "  Generado por scripts/generate-sitemap.mjs en cada build.",
    "  No editarlo a mano: el próximo deploy lo pisa.",
    "-->",
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
    "",
  ].join("\n");
}

async function main() {
  loadEnv();
  // Mismo dominio que SITE.url en src/lib/site.ts, y por el mismo motivo: no
  // sale de una variable de entorno. Al cambiarlo, cambiarlo en los dos lados.
  const baseUrl = "https://www.dz-estudio.com";

  let slugs = [];
  let origen = "";
  try {
    slugs = await slugsFromSupabase();
    origen = "Supabase";
  } catch (error) {
    console.warn(`  ⚠ No pude leer los productos de Supabase (${error.message}).`);
    try {
      slugs = slugsFromMirror();
      origen = "catálogo espejo (src/data/products.ts)";
    } catch (mirrorError) {
      console.warn(`  ⚠ Tampoco el catálogo espejo (${mirrorError.message}).`);
      console.warn("  ⚠ El sitemap sale solo con las páginas fijas.");
      origen = "ninguna";
    }
  }

  const pages = [
    ...STATIC_PAGES,
    ...slugs.map((slug) => ({
      path: `/producto/${slug}`,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, buildXml(baseUrl, pages), "utf8");

  console.log(
    `  ✓ sitemap.xml — ${pages.length} URLs (${slugs.length} productos desde ${origen})`,
  );
}

main().catch((error) => {
  // Un sitemap que no se pudo armar no puede tirar abajo un deploy: la tienda
  // funciona igual sin él.
  console.warn("  ⚠ No se pudo generar el sitemap:", error);
});
