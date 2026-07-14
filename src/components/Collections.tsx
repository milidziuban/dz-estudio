import CollectionCard from "./CollectionCard";

export default function Collections() {
  return (
    <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest">
          ✧ Colecciones destacadas
        </p>
        <h2 className="mb-10 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Elegí tu{" "}
          <em className="font-serif font-normal italic text-petroleo">dupla</em>{" "}
          de color
        </h2>

        <div className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
          <CollectionCard
            title="Fiesta"
            description="Rosa y naranja para mesas que no piden permiso. Manteles y servilletas para ocasiones que se inventan."
            colorA="#F26D9E"
            colorB="#F26430"
            tagColor="orange"
            tagLabel="Rosa + naranja"
            to="/tienda?coleccion=fiesta"
          />
          <CollectionCard
            title="Sobremesa"
            description="Celeste y verde para almuerzos que se estiran hasta la merienda. Individuales y caminos de mesa."
            colorA="#8FC5E8"
            colorB="#7CB562"
            tagColor="verde"
            tagLabel="Celeste + verde"
            to="/tienda?coleccion=sobremesa"
          />
          <CollectionCard
            title="Nocturna"
            description="Lila y petróleo para el living de noche. Almohadones y mantas con más personalidad que algunos invitados."
            colorA="#B8A4E3"
            colorB="#2F5D62"
            tagColor="petroleo"
            tagLabel="Lila + petróleo"
            to="/tienda?coleccion=nocturna"
          />
        </div>
      </div>
    </section>
  );
}
