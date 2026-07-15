import type { FormEvent } from "react";
import Button from "./Button";
import Card from "./Card";

export default function Newsletter() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: conectar con Supabase cuando esté la base
  };

  return (
    <section className="px-5 pb-16 sm:px-8 md:pb-24 lg:px-12">
      <Card className="mx-auto max-w-6xl rounded-3xl bg-celeste p-8 md:p-14">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Novedades{" "}
          <em className="font-serif font-normal italic text-petroleo">
            sin spam
          </em>
        </h2>
        <p className="mt-4 max-w-md leading-relaxed">
          Te escribimos solo cuando hay colección nueva. Edición limitada:
          cuando se van, se van — mejor enterarse antes.
        </p>

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
            placeholder="tu@email.com"
            className="w-full rounded-full border-0 bg-white px-5 py-3.5 font-mono text-sm placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-ink sm:max-w-xs"
          />
          <Button type="submit">Suscribirme ✦</Button>
        </form>
      </Card>
    </section>
  );
}
