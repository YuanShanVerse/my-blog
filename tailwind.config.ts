import type { Config } from 'tailwindcss';

/**
 * Tailwind 只承载「布局 + 排版」能力，颜色全部来自 styles/globals.css 里的 CSS 变量，
 * 这样浅色/深色主题只需要换一套变量，组件里不用写任何 dark: 前缀。
 *
 * 两条中文排版的硬约束（写在这里提醒后来者）：
 *   1. 中文元素禁用负字距（tracking-tight 之类）—— 汉字会让笔画相撞；
 *   2. 中文层级不用 text-transform: uppercase —— 中文没有大小写，只会让中英混排不统一。
 * 层级一律由「字号 + 字重 + 字族」三者共同表达。
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
        // 中文标题走宋体、正文走黑体，拉丁统一由 IBM Plex 承担（字体栈里排在最前）
        serif: ['var(--font-serif)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      maxWidth: {
        // 正文阅读宽度：680px ≈ 38 字/行；页面容器 960px
        reading: '42.5rem',
        wide: '60rem',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1.15rem' }],
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
