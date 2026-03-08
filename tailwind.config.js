/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/frontend/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        matrix: {
          bg: '#111111',
          surface: '#191919',
          border: '#2a2a2a',
          accent: '#f0a500',
          'accent-hover': '#ffb800',
          success: '#3ba55d',
          warning: '#f0a500',
          danger: '#ed4245',
          muted: '#777777',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
