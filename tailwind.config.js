/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: { 900: '#0a0a0f', 800: '#0f0f18', 700: '#16162a', 600: '#1e1e3a' },
        primary: { DEFAULT: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
        secondary: { DEFAULT: '#22d3ee', light: '#67e8f9', dark: '#06b6d4' },
        accent: { yellow: '#f59e0b', green: '#10b981', red: '#f43f5e' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(99,102,241,0.6)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        }
      }
    }
  },
  plugins: []
}
