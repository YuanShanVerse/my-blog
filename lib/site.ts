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

const base = rawSite as unknown as SiteConfig;

/** 正式 URL 只由站点配置决定，避免 Vercel 的部署域名覆盖 canonical 等地址。 */
export const site: SiteConfig = {
  ...base,
  url: base.url.replace(/\/+$/, ''),
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
