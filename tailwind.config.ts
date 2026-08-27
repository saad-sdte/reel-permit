import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1a1916",
          50: "#f4f1ea",
          100: "#e8e4da",
          200: "#d3cdc0",
          400: "#7a7468",
          600: "#4a463e",
          700: "#2e2b26",
          800: "#ffffff",
          900: "#16332b",
        },
        cream: {
          DEFAULT: "#f4f1ea",
          50: "#fbf9f4",
          100: "#f4f1ea",
          200: "#e8e4da",
        },
        copper: {
          DEFAULT: "#2f6f62",
          300: "#7eb3a6",
          400: "#4e9082",
          500: "#2f6f62",
          600: "#215248",
        },
        navy: {
          DEFAULT: "#16332b",
          50: "#f4f1ea",
          100: "#d7e4df",
          200: "#a8c4bb",
          300: "#6f9a8e",
          400: "#4e7d70",
          500: "#2f6f62",
          600: "#215248",
          700: "#16332b",
          800: "#10241f",
          900: "#0c1b17",
          950: "#071210",
        },
        forest: {
          DEFAULT: "#2f6f62",
          50: "#e7f1ee",
          100: "#c5ddd6",
          500: "#2f6f62",
          600: "#215248",
          700: "#16332b",
          800: "#16332b",
          900: "#0c1b17",
        },
        gold: {
          DEFAULT: "#c4a574",
          300: "#e4d3b0",
          400: "#c4a574",
          500: "#a8884f",
          600: "#7d6438",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "IBM Plex Sans", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "IBM Plex Serif", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.08), 0 8px 24px rgb(22 51 43 / 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
