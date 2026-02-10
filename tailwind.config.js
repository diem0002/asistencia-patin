/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'casr-red': '#C92A2A', // Deeper, more professional red
        'casr-green': '#087f5b', // Professional forest green
        'accent': '#F8F9FA', // Light grey for backgrounds
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
    },
  },
  plugins: [],
}
