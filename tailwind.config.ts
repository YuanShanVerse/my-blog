import type { Config } from 'tailwindcss';

/**
 * Tailwind 只承载「布局 + 排版」能力，颜色全部来自 styles/globals.css 里的 CSS 变量，
 * 这样浅色/深色主题只需要换一套变量，组件里不用写任何 dark: 前缀。
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: 'var(--border)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        code: 'var(--code-bg)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      maxWidth: {
        // 正文阅读宽度：680～760px
        reading: '45rem',
        wide: '74rem',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
