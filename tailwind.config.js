/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        foreground: "#f8fafc",
        brand: {
          gold: "#fbbf24",
          goldDark: "#b45309",
          navy: "#0f172a",
          accent: "#38bdf8",
        },
        rarity: {
          common: "#94a3b8",
          rare: "#38bdf8",
          epic: "#a855f7",
          legendary: "#fbbf24",
        }
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Impact", "Bebas Neue", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
      },
      clipPath: {
        slanted: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)",
        card: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)",
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'entrance': 'entrance 0.5s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        entrance: {
          '0%': { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
