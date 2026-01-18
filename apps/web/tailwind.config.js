/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#359EFF",
        "background-light": "#f5f7f8",
        "background-dark": "#0f1923",
        "surface-dark": "#1c3326",
        "surface-light": "#ffffff"
      },
      fontFamily: {
        display: "Inter, system-ui, sans-serif"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      }
    },
  },
  plugins: [],
}
