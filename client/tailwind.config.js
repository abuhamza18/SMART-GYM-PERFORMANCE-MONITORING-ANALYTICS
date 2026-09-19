/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gym: {
          dark: '#05070c',
          panel: '#0c0f1d',
          card: '#12162a',
          accent: '#10b981', // Neon Green
          accentBlue: '#0ea5e9', // Cyan/Blue
          accentYellow: '#f59e0b', // Yellow
          accentRed: '#ef4444', // Red
          text: '#f8fafc',
          muted: '#64748b',
          border: '#1e293b',
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        }
      }
    },
  },
  plugins: [],
}
