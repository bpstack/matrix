/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/frontend/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0a',
          1: '#111111',
          2: '#1a1a1a',
          3: '#222222',
        },
        accent: '#00ff88',
      },
    },
  },
  plugins: [],
};
