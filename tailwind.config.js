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
        // Индиго — основной акцент
        indigo: {
          50: '#EEF0FF',
          100: '#E0E3FF',
          200: '#C6CBFF',
          300: '#A5ABFB',
          400: '#8188F5',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#372FA8',
          800: '#2C2685',
          900: '#221E68',
        },
        // Лайм — «поп» акцент для подсветок и графиков
        lime: {
          50: '#F7FCE3',
          100: '#ECF9BD',
          200: '#DEF48C',
          300: '#CFF04E',
          400: '#C2E834',
          500: '#A6CF1E',
          600: '#82A614',
        },
        // Семантика
        success: '#12A150',
        warning: '#D98A00',
        danger: '#E5484D',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
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
        pop: '0 18px 50px rgba(67, 56, 202, 0.18)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 1px 1px, rgba(23,22,28,0.05) 1px, transparent 0)',
        aurora:
          'radial-gradient(60% 60% at 20% 10%, rgba(79,70,229,0.16) 0%, transparent 60%), radial-gradient(50% 50% at 90% 20%, rgba(194,232,52,0.18) 0%, transparent 55%), radial-gradient(60% 60% at 70% 90%, rgba(79,70,229,0.10) 0%, transparent 60%)',
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
