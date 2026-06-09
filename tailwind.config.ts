import type { Config } from "tailwindcss";

/**
 * Daily Slate design system.
 * Dark, high-contrast, sports-media. Lime primary + electric-blue secondary,
 * with per-sport accent colors surfaced via the `sport-*` palette.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08090B",
          900: "#0B0D10",
          850: "#101319",
          800: "#15181F",
          750: "#1B1F28",
          700: "#232733",
          600: "#2E3340",
        },
        line: "rgba(255,255,255,0.08)",
        lime: {
          DEFAULT: "#C6F24E",
          soft: "#D6F77E",
          deep: "#9FD028",
        },
        electric: {
          DEFAULT: "#4D9FFF",
          deep: "#2E7BE0",
        },
        // Per-sport accents
        sport: {
          nba: "#FF7A1A",
          mlb: "#1FB6B6",
          nhl: "#A875FF",
          wnba: "#FF5C8A",
          soccer: "#35D07F",
          college: "#FFC83D",
          nfl: "#7C9CFF",
          ufc: "#FF3B3B",
          golf: "#69D2B0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 40px -16px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px rgba(198,242,78,0.35), 0 8px 30px -8px rgba(198,242,78,0.25)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22,1,0.36,1) both",
        pop: "pop 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
