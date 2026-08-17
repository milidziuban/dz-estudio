import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import SaveBar from "../../components/admin/SaveBar";
import SettingsSection from "../../components/admin/SettingsSection";
import StatCard from "../../components/admin/StatCard";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import { useSettingsDraft } from "../../hooks/useStoreSettings";
import { useDeleteSubscriber, useSubscribers } from "../../hooks/useSubscribers";
import { downloadCsv, formatDate } from "../../lib/admin";
import { GA_ID } from "../../lib/analytics";
import { SITE } from "../../lib/site";

export default function AdminMarketing() {
  const marketing = useSettingsDraft("marketing");
  const subscribers = useSubscribers();
  const deleteSubscriber = useDeleteSubscriber();

  const lista = subscribers.data ?? [];
  const delMes = lista.filter((subscriber) => {
    const hace30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return new Date(subscriber.createdAt).getTime() >= hace30;
  }).length;

  const marquee = marketing.value.marquee ?? [];

  const setMarquee = (next: string[]) =>
    marketing.update({ ...marketing.value, marquee: next });

  return (
    <>
      <PageHeading
        title={
          <>
            Marketing y{" "}
            <em className="font-serif font-normal italic text-pink">difusión</em>
          </>
        }
        description="La marquesina de la tienda, los suscriptores de la newsletter y por dónde te encuentran."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Suscriptores"
          value={lista.length.toLocaleString("es-AR")}
          hint="del formulario del home"
        />
        <StatCard
          label="Últimos 30 días"
          value={delMes.toLocaleString("es-AR")}
          hint="nuevas suscripciones"
        />
        <StatCard
          label="Google Analytics"
          value={GA_ID ? "Activo" : "Sin configurar"}
          hint={GA_ID ?? "falta VITE_GA_ID en el .env"}
        />
      </div>

      <div className="mt-3 space-y-3">
        <SettingsSection
          title="Marquesina"
          description="La franja negra que corre arriba de todo. Frases cortas, sin punto final: se leen de reojo."
          footer={
            <SaveBar
              dirty={marketing.dirty}
              saved={marketing.saved}
              saving={marketing.saving}
              error={marketing.error}
              onSave={() => void marketing.save()}
              onReset={marketing.reset}
            />
          }
        >
          <ul className="space-y-2">
            {marquee.map((texto, index) => (
              <li key={index} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="font-mono text-xs text-pink"
                >
                  ✦
                </span>
                <input
                  aria-label={`Frase ${index + 1} de la marquesina`}
                  value={texto}
                  onChange={(event) => {
                    const next = [...marquee];
                    next[index] = event.target.value;
                    setMarquee(next);
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-transparent px-3 py-2 font-mono text-xs uppercase tracking-widest focus:border-ink focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={`Quitar la frase ${index + 1}`}
                  onClick={() =>
                    setMarquee(marquee.filter((_, i) => i !== index))
                  }
                  className="font-mono text-[10px] uppercase tracking-widest text-orange/70 transition-colors hover:text-orange"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setMarquee([...marquee, ""])}
            className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink/55 transition-colors hover:text-ink"
          >
            + Agregar frase
          </button>
        </SettingsSection>

        <SettingsSection
          title="Dónde te encuentran"
          description="Se muestran en el footer y en la página de contacto. El cambio de estos campos todavía necesita un deploy para verse en el sitio: hoy el footer los toma de src/lib/site.ts."
          footer={
            <SaveBar
              dirty={marketing.dirty}
              saved={marketing.saved}
              saving={marketing.saving}
              error={marketing.error}
              onSave={() => void marketing.save()}
              onReset={marketing.reset}
            />
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="m-instagram"
              label="Instagram (sin @)"
              value={marketing.value.instagram}
              onChange={(event) =>
                marketing.update({
                  ...marketing.value,
                  instagram: event.target.value.replace("@", ""),
                })
              }
            />
            <TextField
              id="m-whatsapp"
              label="WhatsApp"
              value={marketing.value.whatsapp}
              onChange={(event) =>
                marketing.update({
                  ...marketing.value,
                  whatsapp: event.target.value,
                })
              }
            />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-ink/50">
            En el sitio ahora figuran: @{SITE.instagram} · {SITE.whatsapp} ·{" "}
            {SITE.email}
          </p>
        </SettingsSection>
      </div>

      <div className="mb-3 mt-8 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
          Suscriptores de la newsletter
        </h2>
        <Button
          variant="secondary"
          className="px-5 py-2.5"
          onClick={() =>
            downloadCsv(
              "dz-suscriptores.csv",
              lista.map((subscriber) => ({
                Email: subscriber.email,
                Origen: subscriber.source,
                Fecha: formatDate(subscriber.createdAt),
              })),
            )
          }
        >
          Bajar CSV
        </Button>
      </div>

      {subscribers.error ? (
        <QueryError error={subscribers.error} what="los suscriptores" />
      ) : (
        <AdminTable
          columns={[
            { label: "Email" },
            { label: "Origen", hideOnMobile: true },
            { label: "Alta", align: "right" },
            { label: "", align: "right" },
          ]}
          isLoading={subscribers.isLoading}
          isEmpty={lista.length === 0}
          empty="Todavía no se suscribió nadie."
        >
          {lista.map((subscriber) => (
            <tr
              key={subscriber.id}
              className="border-b border-ink/[0.06] last:border-0"
            >
              <td className="px-4 py-3 font-mono text-xs">{subscriber.email}</td>
              <td className="hidden px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink/50 sm:table-cell">
                {subscriber.source}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-[11px] text-ink/55">
                {formatDate(subscriber.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Borrar ${subscriber.email}?`)) {
                      deleteSubscriber.mutate(subscriber.id);
                    }
                  }}
                  className="font-mono text-[10px] uppercase tracking-widest text-orange/70 transition-colors hover:text-orange"
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </>
  );
}
