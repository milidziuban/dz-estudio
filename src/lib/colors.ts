import type { ColorToken } from "../types/product";

export const COLOR_HEX: Record<ColorToken, string> = {
  pink: "#F26D9E",
  orange: "#F26430",
  celeste: "#8FC5E8",
  verde: "#7CB562",
  lila: "#B8A4E3",
  petroleo: "#2F5D62",
  amarillo: "#F4C542",
  ink: "#1A1A1A",
  cream: "#F3EFE4",
};

/** El mismo color, pero legible como texto sobre cream o blanco (la regla y
 *  los ratios están en globals.css). Amarillo y cream no tienen versión de
 *  texto: van en ink. */
export const COLOR_TEXT_HEX: Record<ColorToken, string> = {
  pink: "#A94C6F",
  orange: "#AB4622",
  celeste: "#337099",
  verde: "#517640",
  lila: "#755AAF",
  petroleo: "#2F5D62",
  amarillo: "#1A1A1A",
  ink: "#1A1A1A",
  cream: "#1A1A1A",
};

/** Orden en el que se ofrecen los colores en el panel. */
export const COLOR_TOKENS: ColorToken[] = [
  "pink",
  "orange",
  "celeste",
  "verde",
  "lila",
  "petroleo",
  "amarillo",
  "ink",
  "cream",
];

export const COLOR_LABEL: Record<ColorToken, string> = {
  pink: "Rosa",
  orange: "Naranja",
  celeste: "Celeste",
  verde: "Verde",
  lila: "Lila",
  petroleo: "Petróleo",
  amarillo: "Amarillo",
  ink: "Tinta",
  cream: "Crema",
};
