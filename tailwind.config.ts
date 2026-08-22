import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        evergreen: {
          950: "#0a1f18",
          900: "#0f2b21",
          800: "#153a2c",
          700: "#1c4a38",
          600: "#265c47",
        },
        gold: {
          400: "#d9bd7d",
          500: "#c9a24b",
          600: "#b38b3a",
          // Darker than 600 specifically so gold text on cream/white
          // backgrounds still clears the 4.5:1 contrast minimum — 500/600
          // read fine as fills or on dark backgrounds but fail as text on
          // light ones.
          700: "#8a6a2c",
        },
        cream: {
          50: "#fbf8f1",
          100: "#f4ecdd",
          200: "#ecdfc7",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      letterSpacing: {
        widest2: "0.25em",
      },
    },
  },
  plugins: [],
};

export default config;
