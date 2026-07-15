import { useState, type FormEvent } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Seo from "../components/Seo";
import TextField from "../components/TextField";
import { SITE } from "../lib/site";

export default function Contacto() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: conectar con Supabase o un servicio de email.
    // Por ahora confirmamos localmente.
    setSent(true);
  };

  return (
    <>
      <Seo
        title="Contacto"
        description="Escribinos por email, WhatsApp o Instagram. También podés visitar el showroom en Palermo con cita previa."
        path="/contacto"
      />

      <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
            ✦ Contacto
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Escribinos{" "}
            <em className="font-serif font-normal italic text-pink">
              sin vueltas
            </em>
          </h1>
          <p className="mb-12 max-w-xl leading-relaxed">
            ¿Dudas con un pedido, ganas de comprar al por mayor, o solo querés
            decir hola? Estamos del otro lado.
          </p>

          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            {/* Formulario */}
            <div>
              {sent ? (
                <Card className="bg-verde p-8">
                  <p className="font-serif text-2xl italic">
                    ¡Recibido! ✦
                  </p>
                  <p className="mt-3 text-sm leading-relaxed">
                    Te respondemos dentro de las 48 horas hábiles. Si es urgente,
                    el WhatsApp siempre es más rápido.
                  </p>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <TextField label="Nombre" id="c-nombre" name="nombre" required />
                  <TextField
                    label="Email"
                    id="c-email"
                    name="email"
                    type="email"
                    required
                  />
                  <div>
                    <label
                      htmlFor="c-mensaje"
                      className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-widest"
                    >
                      Mensaje
                    </label>
                    <textarea
                      id="c-mensaje"
                      name="mensaje"
                      required
                      rows={5}
                      className="w-full rounded-lg border border-ink/25 bg-transparent px-4 py-3 font-mono text-sm placeholder:text-ink/40 transition-colors focus:border-ink focus:outline-none"
                      placeholder="Contanos en qué te damos una mano…"
                    />
                  </div>
                  <Button type="submit">Enviar mensaje ✦</Button>
                </form>
              )}
            </div>

            {/* Datos de contacto */}
            <div className="space-y-8">
              <div>
                <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-ink/60">
                  ✧ Directo
                </h2>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a
                      href={`mailto:${SITE.email}`}
                      className="text-lg font-bold hover:text-pink hover:underline"
                    >
                      {SITE.email}
                    </a>
                    <p className="text-sm text-ink/70">Email — respondemos en 48 h</p>
                  </li>
                  <li>
                    <a
                      href={SITE.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-bold hover:text-verde hover:underline"
                    >
                      WhatsApp
                    </a>
                    <p className="text-sm text-ink/70">
                      Lo más rápido para dudas de pedidos
                    </p>
                  </li>
                  <li>
                    <a
                      href={SITE.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-bold hover:text-orange hover:underline"
                    >
                      @{SITE.instagram}
                    </a>
                    <p className="text-sm text-ink/70">
                      Novedades, detrás de escena y ediciones nuevas
                    </p>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-amarillo p-6">
                <h2 className="font-mono text-xs font-medium uppercase tracking-widest">
                  ✦ Showroom
                </h2>
                <p className="mt-3 font-serif text-xl italic">
                  {SITE.showroom.barrio}
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {SITE.showroom.detalle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
