/** Fallback mientras baja el chunk de una página lazy.
 *  Mismo registro visual que los loaders de Tienda y FeaturedProducts. */
export default function PageLoader() {
  return (
    <p
      className="animate-pulse py-32 text-center font-mono text-sm uppercase tracking-widest"
      role="status"
    >
      ✦ Cargando…
    </p>
  );
}
