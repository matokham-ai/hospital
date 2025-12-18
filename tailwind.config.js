import defaultTheme from 'tailwindcss/defaultTheme'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.tsx',
    './resources/**/*.js',
    './resources/**/*.jsx',
    './resources/**/*.ts',
  ],

  darkMode: 'class',

  theme: {
    extend: {
      /* ===============================
       *  FONT SYSTEM
       * =============================== */
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'Figtree', ...defaultTheme.fontFamily.sans],
      },

      /* ===============================
       *  COLOR PALETTE
       * =============================== */
      colors: {
        /* Core Brand Identity */
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        brand: {
          50: '#ebf8ff',
          100: '#bee3f8',
          500: '#3182ce',
          600: '#2b6cb0',
        },

        /* Semantic Status Colors */
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },

        /* Glass Effects */
        glass: {
          light: 'rgba(255, 255, 255, 0.8)',
          dark: 'rgba(15, 23, 42, 0.8)',
        },
      },

      /* ===============================
       *  BACKDROPS & BLUR
       * =============================== */
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
      },

      /* ===============================
       *  SHADOWS & DEPTH
       * =============================== */
      boxShadow: {
        glow: '0 0 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(0, 0, 0, 0.05)',
        'glow-colored':
          '0 10px 25px -5px rgba(20, 184, 166, 0.25), 0 10px 10px -5px rgba(20, 184, 166, 0.04)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'card-light': '0 4px 14px rgba(0, 0, 0, 0.05)',
        'card-dark': '0 4px 14px rgba(0, 0, 0, 0.4)',
      },

      /* ===============================
       *  BORDER RADIUS
       * =============================== */
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      /* ===============================
       *  BACKGROUND IMAGES
       * =============================== */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',

        /* HMS Signature Gradients */
        'ocean-gradient': 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)',
        'night-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'soft-glass': 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',

        /* Module Themed Gradients */
        'inpatient-gradient': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        'pharmacy-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'billing-gradient': 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
        'lab-gradient': 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
      },

      /* ===============================
       *  ANIMATIONS
       * =============================== */
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 3s',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 15s ease infinite',
        shimmer: 'shimmer 1.5s infinite',
        'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'zoom-in': 'zoom-in 0.4s ease-out',
        'fade-up-smooth': 'fade-up-smooth 0.6s ease-out',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(20, 184, 166, 0.3)',
          },
          '50%': {
            boxShadow:
              '0 0 30px rgba(20, 184, 166, 0.6), 0 0 40px rgba(20, 184, 166, 0.3)',
          },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(100px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-100px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'zoom-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'fade-up-smooth': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },

  /* ===============================
   *  PLUGINS
   * =============================== */
  plugins: [forms, typography],
}
