/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0F',
        surface: '#14141A',
        surface2: '#1A1A22',
        line: '#1F1F28',
        ink: '#F4F4F5',
        ink2: '#A1A1AA',
        ink3: '#71717A',
        // Accent is a CSS variable so Settings can swap it live
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accentHover: 'rgb(var(--accent-hover) / <alpha-value>)',
        success: '#4ADE80',
        warning: '#FBBF24',
        danger: '#F87171',
      },
      opacity: { 12: '0.12', 8: '0.08', 6: '0.06' },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        soft: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -18px rgba(0,0,0,0.8)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.25), 0 8px 30px -10px rgb(var(--accent) / 0.35)',
      },
      letterSpacing: {
        tightish: '-0.015em',
      },
    },
  },
  plugins: [],
};
