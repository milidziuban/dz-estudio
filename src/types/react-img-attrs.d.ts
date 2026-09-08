import "react";

/** React 18 no conoce `fetchPriority`: lo rechaza como prop desconocida y avisa
 *  por consola en cada render. El atributo en minúscula sí lo deja pasar tal
 *  cual al HTML, que es lo que el navegador lee para priorizar la descarga.
 *  Acá le declaramos ese nombre a TypeScript para no perder el tipado.
 *
 *  Cuando el proyecto pase a React 19, `fetchPriority` funciona nativo y este
 *  archivo se puede borrar. */
declare module "react" {
  interface ImgHTMLAttributes<T> {
    fetchpriority?: "high" | "low" | "auto";
  }
}
