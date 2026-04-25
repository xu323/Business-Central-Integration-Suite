/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dde8ff",
          500: "#3b65ff",
          600: "#2c4fe6",
          700: "#1f3bbf",
          900: "#11226b",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Microsoft JhengHei",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
