import About from "../components/About";
import Collections from "../components/Collections";
import FeaturedProducts from "../components/FeaturedProducts";
import Hero from "../components/Hero";
import Newsletter from "../components/Newsletter";
import Seo from "../components/Seo";
import Values from "../components/Values";

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <Hero />
      {/* El catálogo va antes que cualquier texto de marca */}
      <FeaturedProducts />
      <Collections />
      <Values />
      <About />
      <Newsletter />
    </>
  );
}
