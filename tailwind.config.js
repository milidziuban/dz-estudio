/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A1A",
        cream: "#F3EFE4",
        pink: "#F26D9E",
        orange: "#F26430",
        celeste: "#8FC5E8",
        verde: "#7CB562",
        lila: "#B8A4E3",
        petroleo: "#2F5D62",
        amarillo: "#F4C542",
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        mono: ['"DM Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        hard: "4px 4px 0 0 #1A1A1A",
        "hard-lg": "6px 6px 0 0 #1A1A1A",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};
