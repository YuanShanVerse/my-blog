import rawSite from '@/config/site.json';

/** 站点作者信息 */
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

/**
 * 解析站点对外访问地址，优先级从高到低：
 * 1. NEXT_PUBLIC_SITE_URL —— 部署平台 / 本地显式指定（绑定正式域名后填这个）
 * 2. VERCEL_URL           —— Vercel 自动注入的本次部署域名（形如 my-blog-xxx.vercel.app）
 * 3. config/site.json 的 url —— 本地开发时的兜底
 *
 * 这样 canonical / sitemap / RSS / OG 里的绝对地址在三种环境下都自动正确，
 * 不需要为了部署去改代码。
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercelUrl = process.env.VERCEL_URL?.trim();
  // VERCEL_URL 不带协议前缀，需要补上 https
  if (vercelUrl && !/^https?:\/\//i.test(vercelUrl)) {
    return `https://${vercelUrl}`.replace(/\/+$/, '');
  }

  return (rawSite as unknown as SiteConfig).url.replace(/\/+$/, '');
}

export const site: SiteConfig = {
  ...(rawSite as unknown as SiteConfig),
  url: resolveSiteUrl(),
};

/** 把站内路径转成绝对 URL（用于 SEO / RSS） */
export function absoluteUrl(path = '/'): string {
  const base = site.url.endsWith('/') ? site.url : `${site.url}/`;
  return new URL(path.replace(/^\//, ''), base).toString();
}

/** 页面标题：文章标题 · 站点名 */
export function pageTitle(title?: string): string {
  return title ? `${title} · ${site.name}` : site.title;
}

/** 主导航 */
export const mainNav = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
  { href: '/categories', label: '分类' },
  { href: '/about', label: '关于' },
  { href: '/guestbook', label: '留言板' },
] as const;
