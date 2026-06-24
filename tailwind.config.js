/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        dim: "var(--dim)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-line": "var(--accent-line)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": "11px",
        xs: "12px",
        sm: "13px",
        base: "14px",
        md: "15px",
        lg: "16px",
        xl: "18px",
        "2xl": "22px",
        "3xl": "28px",
        "4xl": "40px",
        "5xl": "56px",
        "6xl": "72px",
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.03em",
        tight: "-0.02em",
      },
    },
  },
  plugins: [],
};
