import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import Button from "./Button";
import Card from "./Card";

type Estado = "idle" | "sending" | "ok" | "error";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEstado("sending");

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase(), source: "home" });

    // 23505 = unique violation: ya estaba suscripta, para ella es lo mismo
    if (error && error.code !== "23505") {
      setEstado("error");
      return;
    }

    setEstado("ok");
    setEmail("");
  };

  return (
    <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <Card className="mx-auto max-w-6xl rounded-3xl bg-celeste p-8 md:p-14">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Novedades{" "}
          <em className="font-serif font-normal italic text-petroleo">
            sin spam
          </em>
        </h2>
        <p className="mt-4 max-w-md leading-relaxed">
          Te escribimos cuando hay colección nueva. Edición limitada: mejor
          enterarse antes de que se vayan.
        </p>

        {estado === "ok" ? (
          <p
            role="status"
            className="mt-8 font-mono text-sm uppercase tracking-widest"
          >
            ✦ Listo, quedaste en la lista.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Tu email
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-full border-0 bg-white px-5 py-3.5 font-mono text-sm placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-ink sm:max-w-xs"
            />
            <Button
              type="submit"
              disabled={estado === "sending"}
              className="disabled:opacity-60"
            >
              {estado === "sending" ? "Un segundo…" : "Suscribirme ✦"}
            </Button>
          </form>
        )}

        {estado === "error" && (
          <p role="alert" className="mt-4 text-xs font-semibold text-orange">
            ✕ No pudimos guardarlo. Probá de nuevo en un rato.
          </p>
        )}
      </Card>
    </section>
  );
}
