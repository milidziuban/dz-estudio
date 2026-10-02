import { useEnvioNacional } from "../hooks/useEnvioNacional";
import { useInstallments } from "../hooks/useInstallments";
import { useProducts } from "../hooks/useProducts";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { envioTitular } from "../lib/envio-texto";
import { formatPrice } from "../lib/format";
import { DEFAULT_PROMOS } from "../lib/promos";
import { productoAgotado } from "../lib/stock";
import Button from "./Button";
import Tag from "./Tag";

export default function Hero() {
  const cuotas = useInstallments();
  const envio = useEnvioNacional();
  const { data: products } = useProducts();
  const { data: settings } = useStoreSettings();
  const promos = settings?.marketing.promos ?? DEFAULT_PROMOS;

  // El precio sale de la base: escrito a mano quedó viejo con cada aumento.
  const almohadones = (products ?? []).filter(
    (p) => p.category === "almohadones",
  );
  const preciosAlmohadones = almohadones.map((p) => p.price);
  const almohadonesDesde = preciosAlmohadones.length
    ? Math.min(...preciosAlmohadones)
    : null;

  // La oferta del badge se arma con la promo y el envío del panel. Lo que
  // compraron las primeras clientas fue eso: dos almohadones. Si el combo se
  // apaga o no quedan almohadones, vuelve el badge de cuotas.
  const disponibles = almohadones
    .filter((p) => !productoAgotado(p))
    .map((p) => p.price);
  const minQty = promos.combo.minQty;
  const parMasBarato = disponibles.length
    ? Math.min(...disponibles) * minQty
    : null;
  const conEnvioGratis =
    parMasBarato !== null &&
    envio.activo &&
    envio.gratisDesde !== null &&
    parMasBarato >= envio.gratisDesde;
  const badge =
    promos.combo.enabled && parMasBarato !== null
      ? `${minQty} almohadones: ${promos.combo.percent}% off${
          conEnvioGratis ? " y envío gratis" : ""
        }`
      : cuotas.label;

  return (
    <section className="px-5 pb-12 pt-6 sm:px-8 md:pb-16 md:pt-14 lg:px-12">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-14">
        <div>
          <Tag color="amarillo" className="mb-5">
            ✦ {badge}
          </Tag>

          <h1 className="text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Estampas para usar todos los{" "}
            <em className="font-serif font-normal italic text-pink-ink">
              días
            </em>
            .
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed">
            Almohadones de pana que se sacan para lavar e individuales que se
            limpian en un segundo.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button to="/tienda">Ver los productos</Button>
            <Button variant="secondary" to="/tienda?categoria=almohadones">
              {almohadonesDesde === null
                ? "Ver almohadones"
                : `Almohadones desde ${formatPrice(almohadonesDesde)}`}
            </Button>
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink/65">
            {envioTitular(envio)} ✦ Retiro gratis en Santa Fe Capital
          </p>
        </div>

        {/* Lo primero que se ve es lo que se vende: en el celular la foto va
            arriba del texto, recortada para que la primera pantalla muestre
            producto y titular juntos. Es una foto real, no un render. */}
        <div className="order-first overflow-hidden rounded-2xl md:order-none">
          {/* Sin `width`/`height` esta foto ocupa 0 px hasta que carga y
              empuja media home hacia abajo. Es además el LCP de la home, así
              que va con prioridad alta y sin `lazy`. */}
          <img
            src="/productos/hero-individuales-mesa.webp"
            alt="Mesa puesta con individuales DZ Estudio de ondas naranja y gris, un plato azul y una copa"
            width={768}
            height={1018}
            fetchpriority="high"
            className="aspect-[4/3] w-full object-cover object-[50%_55%] md:aspect-[5/4]"
          />
        </div>
      </div>
    </section>
  );
}
