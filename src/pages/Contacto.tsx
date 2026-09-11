import Seo from "../components/Seo";
import { SITE } from "../lib/site";

// El formulario está sacado a propósito (08/09/2026): no mandaba nada a
// ningún lado —solo mostraba "recibido" y el mensaje se perdía—, así que
// prometía una respuesta que nadie iba a leer. Mientras tanto la página deja
// los tres canales que sí funcionan. Vuelve cuando haya dónde guardar el
// mensaje: ver R4 en el backlog.
export default function Contacto() {
  return (
    <>
      <Seo
        title="Contacto"
        description="Escribinos por email, WhatsApp o Instagram. También podés retirar tu pedido por el depósito en Santa Fe Capital."
        path="/contacto"
      />

      <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
            ✦ Contacto
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Escribinos{" "}
            <em className="font-serif font-normal italic text-pink-ink">
              sin vueltas
            </em>
          </h1>
          <p className="mb-12 max-w-xl leading-relaxed">
            ¿Dudas con un pedido, ganas de comprar al por mayor, o solo querés
            decir hola? Estamos del otro lado.
          </p>

          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            {/* Datos de contacto */}
            <div>
              <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-ink/65">
                ✧ Directo
              </h2>
              <ul className="mt-4 space-y-4">
                <li>
                  <a
                    href={SITE.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold hover:text-verde-ink hover:underline"
                  >
                    WhatsApp {SITE.whatsapp}
                  </a>
                  <p className="text-sm text-ink/70">
                    Lo más rápido para dudas de pedidos
                  </p>
                </li>
                <li>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="text-lg font-bold hover:text-pink-ink hover:underline"
                  >
                    {SITE.email}
                  </a>
                  <p className="text-sm text-ink/70">Email — respondemos en 48 h</p>
                </li>
                <li>
                  <a
                    href={SITE.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold hover:text-orange-ink hover:underline"
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
                ✦ Retiro por el depósito
              </h2>
              <p className="mt-3 font-serif text-xl italic">
                {SITE.retiro.direccion}
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {SITE.retiro.horario}. Avisanos antes por WhatsApp así lo
                tenemos listo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
