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
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['12px', '20px'],
        base: ['14px', '20px'],
        lg: ['16px', '24px'],
        xl: ['20px', '28px'],
      },
    },
  },
  plugins: [],
};
