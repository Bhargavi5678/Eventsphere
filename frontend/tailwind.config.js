/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        darkCard: "#151B2C",
        accentPrimary: "#6366F1",
        accentSecondary: "#A855F7",
        textPrimary: "#F3F4F6",
        textSecondary: "#9CA3AF"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
