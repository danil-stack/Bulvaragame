/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#030712',
          card: '#0f172a',
          panel: '#1e293b',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          gold: '#f59e0b',
          green: '#10b981'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.3s cubic-bezier(.36,.07,.19,.97) infinite',
        'glow': 'glow 2s infinite alternate'
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate3d(-2px, 0, 0) rotate(-1deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translate3d(2px, 0, 0) rotate(1deg)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2), 0 0 10px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 30px rgba(59, 130, 246, 0.6)' }
        }
      }
    }
  },
  plugins: [],
}
