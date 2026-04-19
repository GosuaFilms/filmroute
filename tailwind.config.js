/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          black: '#0a0a0f',
          dark: '#12121a',
          card: '#1a1a26',
          border: '#2a2a3e',
          gold: '#c9a84c',
          'gold-light': '#e8c97a',
          'gold-dark': '#9e7a2f',
          red: '#b91c1c',
          blue: '#1e3a5f',
          'blue-light': '#2563eb',
          muted: '#6b7280',
          text: '#e5e7eb',
          'text-dim': '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-cinema': 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #1a1a26 100%)',
        'gradient-gold': 'linear-gradient(135deg, #c9a84c 0%, #e8c97a 50%, #c9a84c 100%)',
      },
    },
  },
  plugins: [],
}
