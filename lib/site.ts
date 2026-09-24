import rawSite from '@/config/site.json';

/** 站点作者信息。email / twitter / location 允许留空，留空即不在页面渲染 */
export interface SiteAuthor {
  name: string;
  bio: string;
  email: string;
  github: string;
  twitter: string;
  location: string;
}

/** 站点全局配置（唯一数据源：config/site.json） */
export interface SiteConfig {
  name: string;
  nameEn: string;
  title: string;
  tagline: string;
  description: string;
  url: string;
  repo: string;
  locale: string;
  lang: string;
  author: SiteAuthor;
  intro: { lead: string; body: string };
  now: { text: string; updated: string };
  featuredLimit: number;
  postsPerPage: number;
  latestOnHome: number;
  rss: { title: string; description: string; language: string };
}

function normalizeUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  // Vercel 注入的域名不带协议前缀，需要补上 https
  return (/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).replace(/\/+$/, '');
}

/**
 * 解析站点对外访问地址，优先级从高到低：
 * 1. NEXT_PUBLIC_SITE_URL          —— 显式指定（**绑定正式域名后填这个**）
 * 2. VERCEL_PROJECT_PRODUCTION_URL —— Vercel 注入的项目生产域名，同项目内稳定
 * 3. VERCEL_URL                    —— Vercel 注入的本次部署域名
 * 4. config/site.json 的 url        —— 本地开发时的兜底
 *
 * 这样 canonical / sitemap / RSS / OG 里的绝对地址在本地、预览、生产三种环境下都自动正确，
 * 换域名时不需要改代码（只要设一个环境变量）。
 */
function resolveSiteUrl(): string {
  const resolved =
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeUrl(process.env.VERCEL_URL);

  return resolved ?? rawSite.url.replace(/\/+$/, '');
}

const base = rawSite as unknown as SiteConfig;

export const site: SiteConfig = {
  ...base,
  url: resolveSiteUrl(),
};

/**
 * 联系方式的规范化形式：留空的字段一律为 null，页面据此决定渲染与否，
 * 避免出现 `mailto:`（空地址）或指向 example.com 的假链接。
 */
export const contacts = {
  github: site.author.github.trim() || null,
  email: site.author.email.trim() || null,
  twitter: site.author.twitter.trim() || null,
  location: site.author.location.trim() || null,
  /** 仓库地址，用于「查看/编辑本文源文件」 */
  repo: site.repo.trim() || null,
} as const;

/** 把站内路径转成绝对 URL（用于 SEO / RSS） */
export function absoluteUrl(path = '/'): string {
  const origin = site.url.endsWith('/') ? site.url : `${site.url}/`;
  return new URL(path.replace(/^\//, ''), origin).toString();
}

/** 页面标题：文章标题 · 站点名 */
export function pageTitle(title?: string): string {
  return title ? `${title} · ${site.name}` : site.title;
}

/** 文章源文件在仓库中的地址（未配置仓库时返回 null） */
export function repoFileUrl(path: string): string | null {
  return contacts.repo ? `${contacts.repo}/blob/main/${path.replace(/^\//, '')}` : null;
}

/** 顶栏主导航：只留三项，首页由站标承担 */
export const mainNav = [
  { href: '/posts', label: '文章' },
  { href: '/categories', label: '分类' },
  { href: '/about', label: '关于' },
] as const;

/** 完整导航：移动端菜单、页脚与 404 页使用，保证留言板等入口不会被藏起来 */
export const allNav = [...mainNav, { href: '/guestbook', label: '留言板' }] as const;
