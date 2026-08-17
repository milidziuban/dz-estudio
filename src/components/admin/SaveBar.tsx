import Button from "../Button";

type SaveBarProps = {
  dirty: boolean;
  saved: boolean;
  saving: boolean;
  error?: unknown;
  onSave: () => void;
  onReset: () => void;
};

/** Pie de una sección de configuración: guardar, descartar y el acuse. */
export default function SaveBar({
  dirty,
  saved,
  saving,
  error,
  onSave,
  onReset,
}: SaveBarProps) {
  return (
    <>
      <Button
        className="px-6 py-3 disabled:opacity-40"
        disabled={!dirty || saving}
        onClick={onSave}
      >
        {saving ? "Guardando…" : "Guardar cambios ✦"}
      </Button>

      {dirty && !saving && (
        <button
          type="button"
          onClick={onReset}
          className="font-mono text-[10px] uppercase tracking-widest text-ink/50 transition-colors hover:text-ink"
        >
          Descartar
        </button>
      )}

      {saved && !dirty && (
        <p
          role="status"
          className="font-mono text-[10px] uppercase tracking-widest text-verde"
        >
          ✦ Guardado
        </p>
      )}

      {error != null && (
        <p role="alert" className="text-xs font-semibold text-orange">
          ✕{" "}
          {error instanceof Error
            ? error.message
            : "No se pudo guardar. Reintentá."}
        </p>
      )}
    </>
  );
}
