import Accordion, { type QA } from "../components/Accordion";
import Seo from "../components/Seo";

const CATEGORIES: { id: string; symbol: string; title: string; items: QA[] }[] =
  [
    {
      id: "envios",
      symbol: "✦",
      title: "Envíos",
      items: [
        {
          q: "¿A dónde envían?",
          a: "A todo el país, con Andreani y Correo Argentino. En CABA y GBA también podés retirar en el showroom sin costo, coordinando por WhatsApp.",
        },
        {
          q: "¿Cuánto tarda?",
          a: "Andreani, entre 3 y 6 días hábiles. Correo Argentino, entre 4 y 8. Los pedidos se despachan dentro de las 48 horas de acreditado el pago.",
        },
        {
          q: "¿Cuánto cuesta el envío?",
          a: "El costo se calcula en el checkout según el método y tu código postal. El retiro en showroom es siempre gratis.",
        },
        {
          q: "¿Puedo seguir mi pedido?",
          a: "Sí. Apenas lo despachamos te llega el código de seguimiento por email para que lo mires todas las horas, como corresponde.",
        },
      ],
    },
    {
      id: "cambios",
      symbol: "✧",
      title: "Cambios y devoluciones",
      items: [
        {
          q: "¿Puedo cambiar o devolver una pieza?",
          a: "Tenés 30 días desde que recibís el pedido para cambios o devoluciones, siempre que la pieza esté sin usar, sin lavar y con su etiqueta. La devolución del dinero se hace por el mismo medio de pago.",
        },
        {
          q: "¿Quién paga el envío del cambio?",
          a: "Si el cambio es por una falla o un error nuestro, lo pagamos nosotros. Si simplemente cambiaste de idea, el envío corre por tu cuenta.",
        },
        {
          q: "Compré en edición limitada y ya no está, ¿puedo cambiarla?",
          a: "Podés devolverla dentro del plazo, pero no garantizamos cambio por la misma pieza: si la edición se agotó, se agotó. Te ofrecemos otra o el reintegro.",
        },
      ],
    },
    {
      id: "cuidados",
      symbol: "✿",
      title: "Cuidado de las piezas",
      items: [
        {
          q: "¿Cómo las lavo?",
          a: "La mayoría va a máquina con agua fría y ciclo suave. Cada pieza trae su etiqueta con las indicaciones exactas, y también están en la ficha de cada producto. Los almohadones bordados y los bolsos de lona piden lavado a mano.",
        },
        {
          q: "¿Destiñen?",
          a: "No, si seguís las indicaciones. Usamos tintas de buena calidad, pero el primer lavado siempre por separado y con agua fría. Nada de lavandina, nunca.",
        },
        {
          q: "¿Se pueden planchar?",
          a: "Sí, del revés y con vapor. En las piezas con rayas, planchá siguiendo la dirección de la raya para que no se deforme.",
        },
      ],
    },
    {
      id: "mayoristas",
      symbol: "✦",
      title: "Mayoristas",
      items: [
        {
          q: "¿Venden al por mayor?",
          a: "Sí, trabajamos con tiendas de diseño, hoteles boutique y restaurantes. Tenemos lista de precios mayorista a partir de una compra mínima.",
        },
        {
          q: "¿Cómo empiezo?",
          a: "Escribinos por email o WhatsApp contándonos de tu proyecto y te mandamos el catálogo mayorista con condiciones y tiempos de producción.",
        },
        {
          q: "¿Hacen piezas a medida o personalizadas?",
          a: "Para pedidos mayoristas sí: podemos adaptar medidas, colores de nuestra paleta y hasta sumar tu marca en las etiquetas. Los mínimos y plazos dependen del proyecto.",
        },
      ],
    },
  ];

export default function Faq() {
  return (
    <>
      <Seo
        title="Preguntas frecuentes"
        description="Envíos, cambios y devoluciones, cuidado de las piezas y venta mayorista. Todo lo que necesitás saber antes de comprar en DZ Estudio."
        path="/faq"
      />

      <div className="px-5 py-12 sm:px-8 md:py-16 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
            ✦ Preguntas frecuentes
          </p>
          <h1 className="mb-12 text-4xl font-bold tracking-tight sm:text-5xl">
            Lo que{" "}
            <em className="font-serif font-normal italic text-petroleo">
              siempre
            </em>{" "}
            nos preguntan
          </h1>

          <div className="space-y-12">
            {CATEGORIES.map((cat) => (
              <section key={cat.id}>
                <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-medium uppercase tracking-widest">
                  <span aria-hidden="true">{cat.symbol}</span>
                  {cat.title}
                </h2>
                <Accordion items={cat.items} idPrefix={cat.id} />
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
