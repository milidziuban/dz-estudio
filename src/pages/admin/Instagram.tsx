import { useSearchParams } from "react-router-dom";
import IgCompetencia from "../../components/admin/IgCompetencia";
import IgConclusiones from "../../components/admin/IgConclusiones";
import IgNumeros from "../../components/admin/IgNumeros";
import IgPlan from "../../components/admin/IgPlan";
import IgPublicaciones from "../../components/admin/IgPublicaciones";
import PageHeading from "../../components/admin/PageHeading";
import Panel from "../../components/admin/Panel";
import QueryError from "../../components/admin/QueryError";
import SectionTabs from "../../components/admin/SectionTabs";
import { useInstagram } from "../../hooks/useInstagram";
import { formatDate } from "../../lib/admin";
import { fechaLocal } from "../../lib/meta-ads";

const TABS = [
  { id: "conclusiones", label: "Conclusiones" },
  { id: "plan", label: "Qué hacer" },
  { id: "numeros", label: "Números" },
  { id: "publicaciones", label: "Publicaciones" },
  { id: "competencia", label: "Competencia" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AdminInstagram() {
  const { data, isLoading, error } = useInstagram();
  const [searchParams, setSearchParams] = useSearchParams();
  const pedida = searchParams.get("tab");
  const tab: TabId = TABS.some((t) => t.id === pedida)
    ? (pedida as TabId)
    : "conclusiones";
  const setTab = (id: TabId) => {
    const next = new URLSearchParams(searchParams);
    if (id === "conclusiones") next.delete("tab");
    else next.set("tab", id);
    setSearchParams(next);
  };

  const informe = data?.informe ?? null;
  const fecha = (dia: string) => formatDate(fechaLocal(dia).toISOString());

  return (
    <>
      <PageHeading
        title={
          <>
            Instagram,{" "}
            <em className="font-serif font-normal italic text-lila-ink">
              leído
            </em>
          </>
        }
        description={
          informe
            ? `Qué funciona en @${informe.perfil.usuario}, qué no y qué publicar. Datos del ${fecha(informe.desde)} al ${fecha(informe.hasta)}, leídos una vez: no se actualizan solos.`
            : "Qué funciona, qué no y qué publicar."
        }
      />

      {error ? (
        <QueryError
          error={error}
          what="Instagram"
          migration="supabase/migrations/20261125004731_instagram_en_el_panel.sql"
        />
      ) : isLoading ? (
        <p role="status" className="py-16 text-center text-sm text-ink/65">
          Cargando…
        </p>
      ) : !data || !informe ? (
        <Panel title="Sin lectura">
          <p className="py-8 text-center text-sm text-ink/65">
            Todavía no se leyó Instagram.
          </p>
        </Panel>
      ) : (
        <>
          <SectionTabs
            tabs={TABS}
            value={tab}
            onChange={setTab}
            label="Partes del informe de Instagram"
          />
          {tab === "conclusiones" ? (
            <IgConclusiones informe={informe} />
          ) : tab === "plan" ? (
            <IgPlan informe={informe} />
          ) : tab === "numeros" ? (
            <IgNumeros datos={data} informe={informe} />
          ) : tab === "publicaciones" ? (
            <IgPublicaciones posts={data.posts} />
          ) : (
            <IgCompetencia informe={informe} />
          )}
        </>
      )}
    </>
  );
}
