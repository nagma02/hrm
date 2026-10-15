/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F5F7F6',
        surface: '#FFFFFF',
        border: '#E1E8E4',
        foreground: '#202B28',
        muted: '#74817C',
        brand: '#27B995',
        primary: '#172F2B',
        accent: '#27B995',
        success: '#168768',
        warning: '#B7791F',
        danger: '#D9485F',
        info: '#3978C5',
      },
    },
  },
  plugins: [],
}
