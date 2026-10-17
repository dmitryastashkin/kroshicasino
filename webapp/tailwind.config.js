/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kroshi: {
          bg: '#0a0a0f',
          panel: '#131321',
          panel2: '#1b1b2d',
          accent: '#c084fc',
          accent2: '#f472b6',
          success: '#34d399',
          danger: '#f87171',
          warning: '#fbbf24',
          text: '#f3f4f6',
          textDim: '#9ca3af',
          border: '#2a2a40',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Segoe UI"', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        neon: '0 0 24px rgba(192, 132, 252, 0.35)',
        'neon-sm': '0 0 12px rgba(192, 132, 252, 0.2)',
        panel: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
