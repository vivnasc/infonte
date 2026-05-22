import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        creme: "#F2E8DC",
        terra: {
          DEFAULT: "#2E1D12",
          escuro: "#2E1D12",
          texto: "#2A2018",
        },
        ocre: "#B8843D",
        ambar: {
          luz: "#EBAE4A",
          claro: "#F4C56A",
        },
        castanho: {
          DEFAULT: "#5C3D24",
          profundo: "#5C3D24",
          medio: "#5C3D24",
        },
        oliva: "#6B6B47",
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
