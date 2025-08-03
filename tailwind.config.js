/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'meeting-blue': '#3b82f6',
        'meeting-green': '#10b981',
        'meeting-red': '#ef4444',
        'meeting-yellow': '#f59e0b',
        'meeting-purple': '#8b5cf6',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
