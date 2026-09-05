import { Helmet } from "react-helmet-async";
import { SITE } from "../lib/site";
import type { JsonLd } from "../lib/structured-data";

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noindex?: boolean;
  /** Datos estructurados para Google (schema.org). Ver lib/structured-data */
  jsonLd?: JsonLd | JsonLd[];
};

/** El JSON viaja adentro de un <script>, así que un "</script>" perdido en la
 *  descripción de un producto cerraría la etiqueta antes de tiempo y el resto
 *  del texto se ejecutaría como código. Escapar el "<" lo vuelve imposible sin
 *  cambiar lo que el buscador lee. */
const serialize = (data: JsonLd) =>
  JSON.stringify(data).replace(/</g, "\\u003c");

export default function Seo({
  title,
  description,
  image,
  path = "",
  noindex,
  jsonLd,
}: SeoProps) {
  const fullTitle = title
    ? `${title} — ${SITE.name}`
    : `${SITE.name} — ${SITE.tagline}`;
  const desc = description ?? SITE.description;
  const url = `${SITE.url}${path}`;
  const img = image ?? `${SITE.url}/og-cover.png`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {serialize(block)}
        </script>
      ))}
    </Helmet>
  );
}
