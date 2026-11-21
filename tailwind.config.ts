import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Semantic tokens driven by CSS variables (see index.css)
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        content: 'rgb(var(--content) / <alpha-value>)',
        'content-muted': 'rgb(var(--content-muted) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-2': 'rgb(var(--brand-2) / <alpha-value>)',
        'brand-fg': 'rgb(var(--brand-fg) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        badge: 'rgb(var(--badge) / <alpha-value>)',
        'badge-fg': 'rgb(var(--badge-fg) / <alpha-value>)',
        feature: 'rgb(var(--feature) / <alpha-value>)',
        'feature-fg': 'rgb(var(--feature-fg) / <alpha-value>)',
        'feature-muted': 'rgb(var(--feature-muted) / <alpha-value>)',
        'feature-accent': 'rgb(var(--feature-accent) / <alpha-value>)',
        'feature-negative': 'rgb(var(--feature-negative) / <alpha-value>)',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(17 35 32 / 0.03), 0 8px 24px rgb(17 35 32 / 0.04)',
        'soft-lg': '0 2px 6px rgb(0 0 0 / 0.06), 0 18px 50px rgb(0 0 0 / 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
