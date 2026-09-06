import { errorMessage } from "../../lib/admin";

type QueryErrorProps = {
  error: unknown;
  /** Qué se estaba tratando de leer o guardar */
  what: string;
  /** La migración que hace falta para que esta pantalla funcione */
  migration?: string;
};

/** Los errores del panel casi siempre son la migración sin correr o una policy
 *  que falta. Mostramos el mensaje crudo además del texto amable: cuando algo
 *  se rompe, el código de Postgres es la pista útil. */
const MIGRACION_BASE = "supabase/migrations/20260818120000_panel_admin.sql";

export default function QueryError({ error, what, migration }: QueryErrorProps) {
  const message = errorMessage(error, "Error desconocido");

  return (
    <div
      role="alert"
      className="rounded-2xl bg-white p-6 text-sm leading-relaxed"
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-orange">
        No se pudo cargar {what}
      </p>
      <p className="mt-3 text-ink/70">
        Si es la primera vez que entrás, falta correr la migración{" "}
        <code className="font-mono text-xs">{migration ?? MIGRACION_BASE}</code>{" "}
        en el SQL Editor de Supabase.
      </p>
      <p className="mt-3 font-mono text-xs text-ink/65">{message}</p>
    </div>
  );
}
