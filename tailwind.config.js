/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Бумажный тёплый фон — «воздух» интерфейса
        paper: '#F6F5F1',
        surface: '#FFFFFF',
        // Чернила
        ink: {
          DEFAULT: '#17161C',
          soft: '#57545F',
          muted: '#8E8B98',
        },
        line: 'rgba(23, 22, 28, 0.08)',
        // Фирменный жёлтый Setanta Sports — основной акцент
        indigo: {
          50: '#FFFBE5',
          100: '#FFF3B0',
          200: '#FFE36A',
          300: '#FFD82B',
          400: '#FFD106',
          500: '#FFD106',
          600: '#F0C300',
          700: '#C39D00',
          800: '#806600',
          900: '#4D3D00',
        },
        // Дополнительные оттенки того же жёлтого для подсветок и графиков
        lime: {
          50: '#FFFCEB',
          100: '#FFF6C8',
          200: '#FFE977',
          300: '#FFD106',
          400: '#F7C900',
          500: '#D9AF00',
          600: '#8A6F00',
        },
        // Семантика
        success: '#12A150',
        warning: '#D98A00',
        danger: '#E5484D',
      },
      fontFamily: {
        // Заголовки — фирменная Setantica 2023 (Regular Reg), крупные
        // заголовки и логотип — её узкое начертание Light Semi Cond,
        // наборный текст — Noto Sans.
        display: ['Setantica', 'system-ui', 'sans-serif'],
        'display-cond': ['"Setantica Cond"', 'Setantica', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.6rem, 5vw, 4rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2rem, 3.5vw, 2.9rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-md': ['1.65rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '26px',
        '3xl': '34px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 15, 25, 0.04), 0 4px 14px rgba(16, 15, 25, 0.05)',
        lift: '0 10px 34px rgba(16, 15, 25, 0.10), 0 2px 6px rgba(16, 15, 25, 0.04)',
        pop: '0 18px 50px rgba(255, 209, 6, 0.24)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 1px 1px, rgba(23,22,28,0.05) 1px, transparent 0)',
        aurora:
          'radial-gradient(60% 60% at 20% 10%, rgba(255,209,6,0.16) 0%, transparent 60%), radial-gradient(50% 50% at 90% 20%, rgba(255,209,6,0.20) 0%, transparent 55%), radial-gradient(60% 60% at 70% 90%, rgba(255,209,6,0.10) 0%, transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
