/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // macOS-inspired palette
        'store-bg': '#1e1e1e',
        'store-sidebar': '#2d2d2d',
        'store-card': '#3d3d3d',
        'store-accent': '#0a84ff',
        'store-accent-hover': '#409cff',
        'store-text': '#ffffff',
        'store-text-secondary': '#98989d',
      },
    },
  },
  plugins: [],
}
