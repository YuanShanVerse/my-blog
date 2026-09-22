/** 通用工具函数：只依赖标准 JS，服务端 / 客户端都能用。 */

export type ClassValue = string | false | null | undefined;

/** 轻量 className 合并（避免额外依赖 clsx） */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

/** YYYY-MM-DD 解析为本地 Date，避免时区导致的日期偏移 */
export function parseDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const fallback = new Date(input);
  return Number.isNaN(fallback.getTime()) ? new Date(0) : fallback;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 日期格式化
 * - dot:  2026.09.21（列表 / 首页使用，紧凑克制）
 * - iso:  2026-09-21（<time datetime> 使用）
 * - long: 2026 年 9 月 21 日
 */
export function formatDate(input: string | Date, style: 'dot' | 'iso' | 'long' = 'dot'): string {
  const date = parseDate(input);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (style === 'iso') return `${y}-${pad(m)}-${pad(d)}`;
  if (style === 'long') return `${y} 年 ${m} 月 ${d} 日`;
  return `${y}.${pad(m)}.${pad(d)}`;
}

/** 文章排序：按日期倒序，同日按 slug 保证顺序稳定 */
export function sortByDateDesc<T extends { date: string; slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const diff = parseDate(b.date).getTime() - parseDate(a.date).getTime();
    return diff !== 0 ? diff : a.slug.localeCompare(b.slug);
  });
}

/**
 * 时间戳格式化：2026.09.16 10:24
 * 统一按 UTC 计算，保证服务端渲染与客户端水合结果一致（避免 hydration 警告）。
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getUTCFullYear()}.${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())} ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())}`;
}

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const LATIN_WORD_RE = /[A-Za-z0-9][A-Za-z0-9'’-]*/g;

/** 统计中文字符数与英文单词数 */
export function countWords(text: string): { cjk: number; latin: number } {
  const cjk = text.match(CJK_RE)?.length ?? 0;
  const latin = text.replace(CJK_RE, ' ').match(LATIN_WORD_RE)?.length ?? 0;
  return { cjk, latin };
}

/**
 * 预计阅读时间（分钟）
 * 中文按 400 字/分钟、英文按 220 词/分钟估算，更贴近真实中文长文阅读速度。
 */
export function readingTime(text: string): number {
  const { cjk, latin } = countWords(text);
  return Math.max(1, Math.round(cjk / 400 + latin / 220));
}

/** 去掉 Markdown 语法，得到纯文本（用于摘要 / 搜索索引） */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}\d+\.\s+/gm, '')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\$\$?([^$]*)\$\$?/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/^-{3,}$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 生成摘要：优先用 frontmatter 的 description，否则截断正文 */
export function truncate(text: string, max = 120): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

/**
 * 文本消毒：去掉 HTML 标签、控制字符与超长内容。
 * 用于留言板这类「用户输入」场景，配合 React 的默认转义形成双重防护。
 */
export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLength);
}

/** 取名字首字母 / 首字，用作头像占位 */
export function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 1).toUpperCase();
}
