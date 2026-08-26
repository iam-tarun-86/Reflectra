/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#05070E",
          card: "rgba(15, 18, 28, 0.75)",
          cardHover: "rgba(22, 26, 40, 0.88)",
          glass: "rgba(10, 12, 20, 0.65)",
        },
        primary: {
          DEFAULT: "#c084fc",
          light: "#d8b4fe",
          dark: "#9333ea",
          glow: "rgba(192, 132, 252, 0.25)",
        },
        accent: {
          cyan: "#38bdf8",
          emerald: "#34d399",
          amber: "#fbbf24",
          rose: "#fb7185",
        },
        mood: {
          happy: "#10b981",
          sad: "#3b82f6",
          angry: "#ef4444",
          surprise: "#f59e0b",
          fear: "#a855f7",
          disgust: "#84cc16",
          neutral: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "spin-slow": "spin 25s linear infinite",
        "spin-reverse": "spin 35s linear infinite reverse",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "scan-vertical": "scanVertical 3s ease-in-out infinite",
        "sound-wave": "soundWave 1.2s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(1.05)" },
        },
        scanVertical: {
          "0%, 100%": { top: "5%" },
          "50%": { top: "90%" },
        },
        soundWave: {
          "0%, 100%": { height: "4px" },
          "50%": { height: "18px" },
        },
      },
    },
  },
  plugins: [],
};
