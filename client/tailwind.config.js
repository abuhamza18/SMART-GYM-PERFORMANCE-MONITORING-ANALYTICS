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
          // ── Backgrounds ────────────────────────────────────────────────────
          dark:         '#0B0B0D', // Main page background
          panel:        '#111114', // Sidebar / nav background
          card:         '#1A1A1F', // Card background
          cardAlt:      '#222228', // Secondary card / elevated surfaces

          // ── Accents ────────────────────────────────────────────────────────
          accent:       '#FF7A00', // Primary orange
          accentHover:  '#E65C00', // Hover orange
          accentBlue:   '#38BDF8', // Info / cyan
          accentYellow: '#FACC15', // Warning / yellow
          accentRed:    '#FF4D5A', // Error / red

          // ── Text ───────────────────────────────────────────────────────────
          text:         '#F5F5F5', // Primary text
          muted:        '#A1A1AA', // Secondary text

          // ── Borders ────────────────────────────────────────────────────────
          border:       '#303036', // Default border colour
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        sans:    ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-orange': '0 0 20px rgba(255, 122, 0, 0.25)',
        'neon-orange-sm': '0 0 10px rgba(255, 122, 0, 0.15)',
        'neon-green': '0 0 20px rgba(255, 122, 0, 0.25)', // fallback compatibility
        'neon-blue': '0 0 20px rgba(56, 189, 248, 0.20)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'glow-pulse':    'glow-pulse 2s infinite',
        'fade-in':       'fade-in 0.3s ease-out',
        'slide-up':      'slide-up 0.4s ease-out',
        'shake':         'shake 0.5s ease-in-out',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 4px rgba(255, 122, 0, 0.45))' },
          '50%':       { opacity: '0.6', filter: 'drop-shadow(0 0 14px rgba(255, 122, 0, 0.85))' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':       { transform: 'translateX(-5px)' },
          '75%':       { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
}
