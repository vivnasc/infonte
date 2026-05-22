import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        creme: {
          DEFAULT: "#F2E8DC",
          fundo: "#EBE0D0",
        },
        terra: {
          DEFAULT: "#2E1D12",
          escuro: "#2E1D12",
          texto: "#1F1810",
        },
        ocre: {
          DEFAULT: "#B8843D",
          forte: "#9A6C2C",
        },
        ambar: {
          luz: "#EBAE4A",
          claro: "#F4C56A",
        },
        castanho: {
          DEFAULT: "#4A2F1B",
          profundo: "#4A2F1B",
          medio: "#5C3D24",
        },
        oliva: "#5C5C3E",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "EB Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        respirar: "0.01em",
      },
      maxWidth: {
        leitura: "38rem",
      },
    },
  },
  plugins: [],
};

export default config;
