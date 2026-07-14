import Button from "../components/Button";
import Seo from "../components/Seo";

export default function NotFound() {
  return (
    <>
      <Seo title="Página no encontrada" noindex />

      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-20 text-center sm:px-8 lg:px-12">
        <p className="font-mono text-sm font-medium uppercase tracking-widest text-ink/60">
          Error 404
        </p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Esta página se fue{" "}
          <em className="font-serif font-normal italic text-pink">
            de compras
          </em>
          .
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed">
          No encontramos lo que buscabas. Volvé al inicio, que ahí está todo lo
          bueno.
        </p>
        <Button to="/" className="mt-10 px-10 py-4 text-base">
          Volver al inicio ✦
        </Button>
      </div>
    </>
  );
}
