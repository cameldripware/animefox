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
        fox: {
          50: '#fff5f0',
          100: '#ffe8dd',
          200: '#ffcfb8',
          300: '#ffaa85',
          400: '#ff7a4d',
          500: '#FF6B35',
          600: '#e55a2b',
          700: '#bf4722',
          800: '#993a20',
          900: '#7a321e',
        },
        amoled: {
          bg: '#000000',
          card: '#0a0a0a',
          surface: '#121212',
          border: '#1a1a1a',
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'heart-burst': 'heartBurst 0.6s ease-out',
      },
      keyframes: {
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.6))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(255, 107, 53, 1))' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        heartBurst: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}