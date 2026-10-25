import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./nitrkl/**/*.{html,js}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      aspectRatio: {
        "4/3": "4 / 3",
      },
      colors: {
        border: "hsl(var(--border, 214.3 31.8% 91.4%))",
        background: "hsl(var(--background, 0 0% 100%))",
        foreground: "hsl(var(--foreground, 222.2 84% 4.9%))",
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 222.2 84% 4.9%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 210 40% 96.1%))",
          foreground: "hsl(var(--muted-foreground, 215.4 16.3% 46.9%))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary, 0 60% 29%))",
          foreground: "hsl(var(--primary-foreground, 210 40% 98%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 24 64% 59%))",
          foreground: "hsl(var(--accent-foreground, 0 0% 100%))",
        },
      },
    },
  },
  plugins: [],
};

export default config;
