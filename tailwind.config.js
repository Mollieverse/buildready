/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        card: "#111111",
        border: "#1E1E1E",
        muted: "#A1A1AA",
        accent: {
          blue: "#3B82F6",
          green: "#22C55E",
          orange: "#F59E0B",
          red: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};
