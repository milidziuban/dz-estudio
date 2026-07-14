import About from "../components/About";
import Collections from "../components/Collections";
import Hero from "../components/Hero";
import Newsletter from "../components/Newsletter";
import Seo from "../components/Seo";
import Values from "../components/Values";

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <Hero />
      <Collections />
      <Values />
      <About />
      <Newsletter />
    </>
  );
}
