/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#1a365d', // الأزرق الداكن الأساسي
          900: '#164e63',
          950: '#083344',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#d4af37', // الذهبي للإبرازات
          800: '#b45309',
          900: '#78350f',
          950: '#451a03',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // نظام Dark Mode
        dark: {
          'primary': '#1a365d',
          'secondary': '#2d3748',
          'accent': '#d4af37',
          'background': '#0a0e13',
          'surface': '#1a1e23',
          'text': '#e2e8f0',
          'muted': '#718096'
        },
        // نظام Light Mode 
        light: {
          'primary': '#1a365d',
          'secondary': '#f7fafc',
          'accent': '#d4af37',
          'background': '#ffffff',
          'surface': '#f7fafc',
          'text': '#1a202c',
          'muted': '#4a5568'
        }
      },
      fontFamily: {
        'arabic': ['Cairo', 'Tajawal', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        'display': ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        'body': ['IBM Plex Sans Arabic', 'Cairo', 'system-ui', 'sans-serif'],
        'en': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs-ar': ['0.75rem', { lineHeight: '1.8' }],
        'sm-ar': ['0.875rem', { lineHeight: '1.8' }],
        'base-ar': ['1rem', { lineHeight: '1.8' }],
        'lg-ar': ['1.125rem', { lineHeight: '1.8' }],
        'xl-ar': ['1.25rem', { lineHeight: '1.8' }],
        '2xl-ar': ['1.5rem', { lineHeight: '1.7' }],
        '3xl-ar': ['1.875rem', { lineHeight: '1.6' }],
        '4xl-ar': ['2.25rem', { lineHeight: '1.5' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '92': '23rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(26, 54, 93, 0.3)',
        'glow-accent': '0 0 20px rgba(212, 175, 55, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-quantum': 'linear-gradient(135deg, #1a365d 0%, #0369a1 50%, #d4af37 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0e13 0%, #1a1e23 100%)'
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  darkMode: 'class', // تمكين Dark Mode
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
        '.text-shadow': {
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '4px 4px 8px rgba(0,0,0,0.2)',
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }
      }
      addUtilities(newUtilities)
    }
  ],
}