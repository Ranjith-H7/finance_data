/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        glow: '0 20px 60px rgba(99, 102, 241, 0.18)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top left, rgba(99,102,241,.25), transparent 35%), radial-gradient(circle at top right, rgba(16,185,129,.18), transparent 30%), linear-gradient(135deg, #0f172a 0%, #111827 100%)',
      },
    },
  },
  plugins: [],
};
