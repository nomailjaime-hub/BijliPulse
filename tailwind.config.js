/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef1f6',
          100: '#d8ddec',
          200: '#b3bad0',
          300: '#8893b3',
          400: '#636e94',
          500: '#4a5478',
          600: '#3b4563',
          700: '#2f3650',
          800: '#1f2335',
          900: '#161929',
          950: '#0d0f1a',
        },
        amber: {
          50: '#fffaeb',
          100: '#fff0c6',
          200: '#ffe088',
          300: '#ffc94a',
          400: '#ffb01f',
          500: '#f89509',
          600: '#dd6c02',
          700: '#b74a06',
          800: '#94370c',
          900: '#7a2e0d',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
