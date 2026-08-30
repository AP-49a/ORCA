/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orca: {
          surface: 'var(--surface)',
          'surface-hover': 'var(--surface-hover)',
          'surface-active': 'var(--surface-active)',
          'surface-subtle': 'var(--surface-subtle)',
          'bg-primary': 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          card: 'var(--surface)',
          border: 'var(--border)',
          'border-subtle': 'var(--border-subtle)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          'accent-subtle': 'var(--accent-subtle)',
          'accent-border': 'var(--accent-border)',
        },
        depth: {
          surface: '#0284C7',       // Active (Surface) - Sky Blue
          shallow: '#0D9488',       // Idle (Shallow) - Teal
          deep: '#4F46E5',          // Suspended (Deep) - Indigo/Deep Ocean
          abyss: '#1E1B4B',         // Hibernated (Abyss) - Dark Navy
        }
      },
      boxShadow: {
        'orca-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'orca-md': '0 4px 12px -2px rgba(2, 132, 199, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'orca-lg': '0 10px 25px -3px rgba(2, 132, 199, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'orca-modal': '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'orca-glass': '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'wave-pulse': 'wavePulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.18s ease-out',
      },
      keyframes: {
        wavePulse: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
