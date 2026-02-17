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
        // Premium functionality colors
        primary: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#bfa094',
          600: '#a18072',
          700: '#977669',
          800: '#846358',
          900: '#43302b',
        },
        // Backgrounds
        'warm-neutral': '#f5f2ec',
        'warm-gray': '#e8e6e3',
        'paper': '#fdfbf7',

        // Dark Mode
        'dark-bg': '#1c1b1a',
        'dark-paper': '#2a2927',
        'dark-paper': '#2a2927',
        'dark-text': '#fdf8f6', // Warmer white (primary-50)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        handwriting: ['Caveat', '"Indie Flower"', 'cursive'],
      },
      boxShadow: {
        'book': '0 20px 40px -5px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
        'book-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'page-left': 'inset -15px 0 20px -10px rgba(0, 0, 0, 0.05), 5px 0 15px rgba(0,0,0,0.05)',
        'page-right': 'inset 15px 0 20px -10px rgba(0, 0, 0, 0.05), -5px 0 15px rgba(0,0,0,0.05)',
        'spine': 'inset 0 0 40px rgba(0,0,0,0.05)',
      },
      backgroundImage: {
        'spine-gradient': 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 55%, transparent 100%)',
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      animation: {
        'flip-next': 'flipNext 0.8s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards',
        'flip-prev': 'flipPrev 0.8s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        flipNext: {
          '0%': { transform: 'rotateY(0)' },
          '100%': { transform: 'rotateY(-180deg)' },
        },
        flipPrev: {
          '0%': { transform: 'rotateY(-180deg)' },
          '100%': { transform: 'rotateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
