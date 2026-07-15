import Button from "../components/Button";
import Card from "../components/Card";

export default function CheckoutError() {
  return (
    <div className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <Card className="mx-auto max-w-2xl overflow-hidden text-center">
        <div className="bg-orange pb-10 pt-10 text-cream">
          <p className="text-5xl" aria-hidden="true">
            ✕
          </p>
          <h1 className="mt-4 px-6 text-4xl font-bold tracking-tight sm:text-5xl">
            El pago{" "}
            <em className="font-serif font-normal italic">no salió</em>
          </h1>
        </div>

        <div className="px-6 pb-10 pt-6 sm:px-12">
          <p className="leading-relaxed">
            Mercado Pago rechazó el pago o lo cancelaste antes de terminar. No
            se cobró nada y tu carrito sigue intacto — podés intentar de nuevo o
            pagar por transferencia.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button to="/checkout">Volver a intentar ✦</Button>
            <Button to="/tienda" variant="secondary">
              Seguir mirando
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
