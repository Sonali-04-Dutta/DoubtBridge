/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6f2ff",
          100: "#eee5ff",
          200: "#dcc7ff",
          300: "#c5a3ff",
          400: "#ad7dff",
          500: "#8f4fff",
          600: "#7b35f0",
          700: "#6428c8",
          800: "#4f2299",
          900: "#3f1f75"
        }
      },
      boxShadow: {
        glow: "0 18px 35px rgba(143, 79, 255, 0.22)",
        card: "0 12px 30px rgba(18, 20, 27, 0.08)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};
