import { useId, useState, type FormEvent } from "react";
import { cn } from "../../lib/cn";
import { supabase } from "../../lib/supabase";

type Estado = "idle" | "sending" | "ok" | "error";

/** Lista de espera de Pliego. Usa la misma tabla que el newsletter de la
 *  home, con `source: "pliego"`, así los mails aparecen en el panel
 *  (Marketing → suscriptores) y se pueden filtrar por origen.
 *
 *  Ojo: el mail es único en la tabla. Si alguien ya estaba suscripta desde la
 *  home, el alta no cambia su origen (la policy no deja actualizar desde la
 *  tienda); para ella el resultado es el mismo y se le muestra "listo". */
type PliegoEsperaProps = {
  titulo?: string;
  texto?: string;
  /** En una fila y sin título: en la portada, donde iría el botón. */
  compacta?: boolean;
};

export default function PliegoEspera({
  titulo = "Sumate a la lista de espera",
  texto = "Te escribimos una sola vez, cuando salgan las primeras unidades.",
  compacta = false,
}: PliegoEsperaProps) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const inputId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEstado("sending");

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase(), source: "pliego" });

    // 23505 = unique violation: ya estaba en la lista
    if (error && error.code !== "23505") {
      setEstado("error");
      return;
    }

    setEstado("ok");
    setEmail("");
  };

  return (
    <div className={cn("flex flex-col", compacta ? "gap-3" : "gap-5")}>
      {compacta ? (
        <p className="text-[15px] leading-6 text-pliego-tinta-suave">{texto}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium leading-7">{titulo}</h2>
          <p className="text-pliego-tinta-suave">{texto}</p>
        </div>
      )}

      {estado === "ok" ? (
        <p role="status" className="rounded-sm bg-pliego-salvia-suave px-4 py-3 text-pliego-tinta">
          Listo, quedaste en la lista. Te avisamos por mail.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={cn("flex gap-3", compacta ? "flex-wrap" : "flex-col")}
        >
          <label
            htmlFor={inputId}
            className={compacta ? "sr-only" : "text-[13px] leading-5 text-pliego-tinta-suave"}
          >
            Tu mail
          </label>
          <input
            id={inputId}
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@mail.com"
            className={cn(
              "h-12 rounded-sm border border-pliego-piedra bg-white px-3.5 text-pliego-tinta placeholder:text-pliego-tinta-suave focus:border-pliego-tinta focus:outline-none",
              compacta && "min-w-0 flex-[1_1_14rem]",
            )}
          />
          <button
            type="submit"
            disabled={estado === "sending"}
            className={cn(
              "h-12 rounded-sm bg-pliego-salvia font-medium text-pliego-tinta transition-colors hover:bg-[#8FA590] disabled:opacity-60",
              compacta && "flex-auto px-6",
            )}
          >
            {estado === "sending" ? "Enviando…" : "Avisame"}
          </button>
          {estado === "error" && (
            <p role="alert" className="basis-full text-sm text-orange-ink">
              No pudimos guardar tu mail. Probá de nuevo en un rato.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
