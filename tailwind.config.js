/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#e11d2e',
          'red-deep': '#a81320',
          'red-hover': '#ff3647',
          'red-light': '#ffd9dd',
          'red-glow': 'rgba(225, 29, 46, 0.45)',
          dark: '#080b11',
          'dark-subtle': '#0c1018',
          card: '#111622',
          'card-hover': '#161e2e',
          'card-elevated': '#1c2538',
          border: '#1f293d',
          'border-light': 'rgba(255, 255, 255, 0.08)',
          ink: '#f8fafc',
          slate: '#94a3b8',
          muted: '#64748b',
          cream: '#faf7f2',
          sand: '#f3ece1',
        },
      },
      boxShadow: {
        'glow-red-sm': '0 0 15px -2px rgba(225, 29, 46, 0.3)',
        'glow-red': '0 0 25px -3px rgba(225, 29, 46, 0.45)',
        'glow-red-lg': '0 0 45px -5px rgba(225, 29, 46, 0.65)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
        'card-elevated': '0 20px 40px -15px rgba(0, 0, 0, 0.85)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
