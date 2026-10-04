/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // The UI leans on subtle hairlines, so add the intermediate steps
      // between Tailwind's default 5/10/20 opacity scale.
      opacity: {
        6: "0.06",
        8: "0.08",
        12: "0.12",
        14: "0.14",
        18: "0.18",
        35: "0.35",
        45: "0.45",
        85: "0.85",
      },
      colors: {
        ink: {
          950: "#080b12",
          900: "#0d1220",
          850: "#131a2b",
          800: "#1a2338",
          700: "#26314b",
          600: "#3a4763",
        },
        mint: {
          300: "#7ee3c0",
          400: "#43d6a5",
          500: "#1fbd8b",
        },
        amber: {
          400: "#f0b95c",
          500: "#d99a34",
        },
        rose: {
          400: "#f2708c",
          500: "#d94a6b",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(67,214,165,0.18), 0 18px 50px -18px rgba(8,11,18,0.9)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(8,11,18,0) 0%, rgba(8,11,18,0.9) 78%)",
      },
    },
  },
  plugins: [],
};
