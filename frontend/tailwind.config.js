/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0F1524",
          900: "#151D30",
          800: "#1F2A44",
          700: "#2B3A5E",
          600: "#3B4F7D",
        },
        brass: {
          400: "#D8A73D",
          500: "#C6922A",
          600: "#A87A1F",
        },
        leaf: {
          500: "#1B7A43",
          600: "#166636",
        },
        alert: {
          500: "#C0392B",
          600: "#A5301F",
        },
        amberflag: {
          500: "#B8860B",
        },
        paper: "#F6F5F1",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,21,36,0.06), 0 4px 14px rgba(15,21,36,0.06)",
      },
    },
  },
  plugins: [],
}
