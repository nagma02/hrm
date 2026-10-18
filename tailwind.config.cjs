/**
 * HRM 3-color system: Dark Green #1B362B, Light Emerald #E6F4EA (#2A5243 on dark
 * surfaces) and Pure White #FFFFFF. Every Tailwind palette except `red` (kept for
 * critical error states) is remapped onto that family, so classes like
 * `bg-blue-50` or `text-amber-700` can't reintroduce other hues.
 * Loaded from src/index.css via `@config` (Tailwind v4).
 * @type {import('tailwindcss').Config}
 */
const emerald = {
  50: '#F0FDF4',
  100: '#E6F4EA',
  200: '#CFEBD7',
  300: '#CFEBD7',
  400: '#4B826F',
  500: '#2A5243',
  600: '#1B362B',
  700: '#1B362B',
  800: '#1B362B',
  900: '#1B362B',
  950: '#12251D',
}

const neutral = {
  50: '#F0FDF4',
  100: '#E6F4EA',
  200: '#E2E8F0',
  300: '#C4D3CB',
  400: '#8FA399',
  500: '#5F6F68',
  600: '#4B5F56',
  700: '#2A5243',
  800: '#1B362B',
  900: '#1B362B',
  950: '#12251D',
}

const chromatic = ['blue', 'sky', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ...Object.fromEntries(chromatic.map((name) => [name, emerald])),
        ...Object.fromEntries(neutrals.map((name) => [name, neutral])),
        background: '#FFFFFF',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        foreground: '#1B362B',
        muted: '#5F6F68',
        brand: '#1B362B',
        primary: '#1B362B',
        'primary-soft': '#E6F4EA',
        'primary-on-dark': '#2A5243',
        accent: '#E6F4EA',
        success: '#1B362B',
        warning: '#1B362B',
        info: '#1B362B',
        danger: '#DC2626',
        mint: '#E6F4EA',
      },
      ringColor: { DEFAULT: '#1B362B' },
    },
  },
  plugins: [],
}
