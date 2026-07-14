import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: { DEFAULT: '0px', none: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', full: '9999px' },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        aegis: {
          'bg-base':        '#0d1117',
          'bg-panel':       '#111418',
          'bg-panel-hover': '#161b22',
          'bg-overlay':     '#1c2128',
          'bg-input':       '#0d1117',
          'border-panel':   '#1e2a38',
          'border-strong':  '#2d3748',
          'border-focus':   '#f59e0b',
          'text-primary':   '#e2e8f0',
          'text-secondary': '#94a3b8',
          'text-muted':     '#6b7280',
          'text-mono':      '#cbd5e1',
        },
      },
      height: {
        'topnav': '48px',
        'footer': '40px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'highlight-fade': 'highlight-fade 2s ease-out forwards',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
          '50%': { boxShadow: '0 0 8px 2px rgba(239, 68, 68, 0.5)' },
        },
        'highlight-fade': {
          '0%': { borderTopColor: 'rgba(245, 158, 11, 0.4)' },
          '100%': { borderTopColor: 'transparent' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
