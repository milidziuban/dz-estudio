import { useMemo, useState } from "react";
import { useAdminProducts } from "../../hooks/useAdminProducts";
import { SITE } from "../../lib/site";
import SelectField from "../SelectField";
import TextField from "../TextField";

/**
 * Armador de links con etiqueta.
 *
 * Casi la mitad de las visitas llega "sin dato": el navegador de Instagram y
 * WhatsApp no dicen de dónde vienen. Un link con `utm_source` y `utm_medium`
 * sí lo dice, y el panel lo muestra como "Instagram · bio" o "WhatsApp ·
 * estado". Es lo único que separa la bio de una historia.
 *
 * Los nombres van cortos y en minúscula a propósito: son los que reconoce
 * `clasificarOrigen` en `lib/origen.ts`.
 */

const LUGARES = [
  { id: "instagram/bio", label: "Instagram · link de la bio" },
  { id: "instagram/historia", label: "Instagram · historia" },
  { id: "instagram/post", label: "Instagram · post o reel" },
  { id: "instagram/dm", label: "Instagram · mensaje directo" },
  { id: "whatsapp/mensaje", label: "WhatsApp · mensaje" },
  { id: "whatsapp/estado", label: "WhatsApp · estado" },
  { id: "facebook/post", label: "Facebook · post" },
  { id: "mail/newsletter", label: "Mail · newsletter" },
] as const;

/** "Cyber Monday!" → "cyber-monday" */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function LinkBuilder() {
  const { data: products = [] } = useAdminProducts();
  const [lugar, setLugar] = useState<string>(LUGARES[0].id);
  const [destino, setDestino] = useState("/");
  const [campana, setCampana] = useState("");
  const [copiado, setCopiado] = useState(false);

  const link = useMemo(() => {
    const [source, medium] = lugar.split("/");
    const url = new URL(destino, SITE.url);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", medium);
    const camp = slugify(campana);
    if (camp) url.searchParams.set("utm_campaign", camp);
    return url.toString();
  }, [lugar, destino, campana]);

  const copiar = () => {
    void navigator.clipboard
      ?.writeText(link)
      .then(() => {
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2000);
      })
      .catch(() => setCopiado(false));
  };

  return (
    <section className="mt-3 rounded-2xl bg-white p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
          Armá un link con etiqueta
        </h2>
        <p className="font-mono text-[11px] text-ink/65">
          para saber de dónde vino cada visita
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          id="link-lugar"
          label="Dónde lo vas a poner"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
        >
          {LUGARES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="link-destino"
          label="A qué página lleva"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
        >
          <option value="/">La home</option>
          <option value="/tienda">La tienda</option>
          <option value="/tienda?categoria=almohadones">Almohadones</option>
          <option value="/tienda?categoria=individuales">Individuales</option>
          {products.map((p) => (
            <option key={p.slug} value={`/producto/${p.slug}`}>
              {p.name.split(" · ")[0]}
            </option>
          ))}
        </SelectField>

        <TextField
          id="link-campana"
          label="Campaña (opcional)"
          placeholder="ej. cyber monday"
          value={campana}
          maxLength={60}
          onChange={(e) => setCampana(e.target.value)}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 break-all rounded-lg bg-cream px-4 py-3 font-mono text-xs">
          {link}
        </code>
        <button
          type="button"
          onClick={copiar}
          className="shrink-0 rounded-full bg-ink px-6 py-3 font-mono text-xs font-medium uppercase tracking-widest text-cream transition-colors hover:bg-ink/80"
        >
          {copiado ? "Copiado ✓" : "Copiar link"}
        </button>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink/65">
        Usá uno distinto para cada lugar: el de la bio en la bio, otro en cada
        historia. En el cuadro de origen van a aparecer separados. Un link sin
        etiqueta que se abre desde WhatsApp cae en "Sin dato".
      </p>
    </section>
  );
}
