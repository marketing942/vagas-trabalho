import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Azul-marinho do Colégio CPPEM: base institucional, calma e confiável
        brand: {
          50: "#f3f5fa",
          100: "#e3e9f3",
          200: "#c3d0e6",
          300: "#94a8d0",
          400: "#5f79b0",
          500: "#1e2f5e",
          600: "#162247",
          700: "#122a5c",
          800: "#0f2150",
          900: "#0b1a40",
          950: "#071230",
        },
        // Dourado CPPEM (mesmo da nova identidade): detalhes, destaques e ações
        accent: {
          50: "#fbf6e9",
          100: "#f6ebcd",
          200: "#f0dcb0",
          300: "#e3c98f",
          400: "#d3b87f",
          500: "#c9ae7a",
          600: "#8a7040",
          700: "#6e5a33",
          800: "#54442a",
          900: "#3d3220",
          950: "#241d12",
        },
        // Tokens que trocam entre tema claro e escuro (variáveis em globals.css)
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        canvas2: "rgb(var(--c-canvas2) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        line2: "rgb(var(--c-line2) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        inksoft: "rgb(var(--c-inksoft) / <alpha-value>)",
        inkmuted: "rgb(var(--c-inkmuted) / <alpha-value>)",
        goldink: "rgb(var(--c-goldink) / <alpha-value>)",
        goldsoft: "rgb(var(--c-goldsoft) / <alpha-value>)",
        goldfaint: "rgb(var(--c-goldfaint) / <alpha-value>)",
        goldline: "rgb(var(--c-goldline) / <alpha-value>)",
        good: "rgb(var(--c-good) / <alpha-value>)",
        goodsoft: "rgb(var(--c-goodsoft) / <alpha-value>)",
        bad: "rgb(var(--c-bad) / <alpha-value>)",
        badsoft: "rgb(var(--c-badsoft) / <alpha-value>)",
        // Creme: fundos acolhedores (no lugar do branco frio / preto)
        cream: {
          50: "#fdfbf6",
          100: "#f9f4e8",
          200: "#f1e8d3",
          300: "#e4d7b9",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
        eyebrow: ["var(--font-eyebrow)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 34px -14px rgba(11, 26, 64, 0.20)",
        lift: "0 22px 50px -18px rgba(11, 26, 64, 0.30)",
        gold: "0 14px 34px -12px rgba(175, 146, 86, 0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
