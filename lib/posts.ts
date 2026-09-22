import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { FALLBACK_CATEGORY, getAllCategories, resolveCategory, type Category } from '@/lib/categories';
import { readingTime, sortByDateDesc, stripMarkdown } from '@/lib/utils';

/**
 * 内容层：负责把 content/posts/*.md 读成结构化数据。
 * 只在构建期（Server Component / Route Handler）被调用，不会打进浏览器包。
 */

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/;

/** 文章元信息（不含正文） */
export interface PostMeta {
  /** URL 片段，即文件名去掉 .md */
  slug: string;
  title: string;
  description: string;
  /** 发布日 YYYY-MM-DD */
  date: string;
  /** 最后更新日 YYYY-MM-DD，未填写时为 null */
  updated: string | null;
  /** 分类 slug */
  category: string;
  /** 分类展示名 */
  categoryName: string;
  tags: string[];
  author: string;
  /** 封面图路径（可选） */
  cover: string | null;
  draft: boolean;
  featured: boolean;
  /** 预计阅读分钟数 */
  readingTime: number;
  /** 正文字数（中文按字、英文按词） */
  words: number;
  /** 纯文本摘要，用于搜索与列表兜底 */
  excerpt: string;
}

/** 文章完整数据 */
export interface Post extends PostMeta {
  /** 未渲染的 Markdown 正文 */
  body: string;
}

interface Frontmatter {
  title?: unknown;
  description?: unknown;
  date?: unknown;
  updated?: unknown;
  category?: unknown;
  tags?: unknown;
  author?: unknown;
  cover?: unknown;
  draft?: unknown;
  featured?: unknown;
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
}

function asDateString(value: unknown): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const text = asString(value);
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (match) {
    return `${match[1]}-${match[2]!.padStart(2, '0')}-${match[3]!.padStart(2, '0')}`;
  }
  return text;
}

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  const text = asString(value);
  return text ? text.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) : [];
}

function listPostFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .filter((file) => !file.startsWith('_'));
}

function parsePost(fileName: string): Post | null {
  const slug = fileName.replace(/\.mdx?$/, '');
  if (!SLUG_RE.test(slug)) {
    console.warn(`[posts] 跳过非法文件名：${fileName}（slug 只允许字母、数字、- 和 _）`);
    return null;
  }

  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), 'utf8');
  const { data, content } = matter(raw);
  const front = data as Frontmatter;

  const title = asString(front.title) || slug;
  const body = content.trim();
  const plain = stripMarkdown(body);
  const category = resolveCategory(asString(front.category)) ?? FALLBACK_CATEGORY;

  return {
    slug,
    title,
    description: asString(front.description) || plain.slice(0, 120),
    date: asDateString(front.date) || '1970-01-01',
    updated: asString(front.updated) ? asDateString(front.updated) : null,
    category: category.slug,
    categoryName: category.name,
    tags: asTags(front.tags),
    author: asString(front.author) || '',
    cover: asString(front.cover) || null,
    draft: front.draft === true || asString(front.draft).toLowerCase() === 'true',
    featured: front.featured === true || asString(front.featured).toLowerCase() === 'true',
    readingTime: readingTime(plain),
    words: plain.replace(/\s/g, '').length,
    excerpt: plain.slice(0, 300),
    body,
  };
}

/** 读取全部文章（已发布，按时间倒序）。draft: true 的文章不会出现在任何列表中。 */
export function getAllPosts(): PostMeta[] {
  const posts: PostMeta[] = [];
  for (const file of listPostFiles()) {
    const post = parsePost(file);
    if (post && !post.draft) {
      const { body: _body, ...meta } = post;
      posts.push(meta);
    }
  }
  return sortByDateDesc(posts);
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

/** 读取全部文章（含正文）。仅用于构建期的搜索索引 / RSS 等场景。 */
export function getAllPostsWithBody(): Post[] {
  const posts: Post[] = [];
  for (const file of listPostFiles()) {
    const post = parsePost(file);
    if (post && !post.draft) posts.push(post);
  }
  return posts.sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return diff !== 0 ? diff : a.slug.localeCompare(b.slug);
  });
}

/** 按 slug 读取单篇文章（含正文），不存在返回 null */
export function getPostBySlug(slug: string): Post | null {
  if (!SLUG_RE.test(slug)) return null;
  const file = listPostFiles().find((name) => name.replace(/\.mdx?$/, '') === slug);
  if (!file) return null;
  const post = parsePost(file);
  if (!post || post.draft) return null;
  return post;
}

export function getFeaturedPosts(limit: number): PostMeta[] {
  const posts = getAllPosts();
  const featured = posts.filter((post) => post.featured);
  return (featured.length > 0 ? featured : posts).slice(0, limit);
}

export function getLatestPosts(limit: number): PostMeta[] {
  return getAllPosts().slice(0, limit);
}

export function getPostsByCategory(categorySlug: string): PostMeta[] {
  return getAllPosts().filter((post) => post.category === categorySlug);
}

/** 分类 + 文章数量 */
export interface CategoryWithCount extends Category {
  count: number;
}

export function getCategoriesWithCount(): CategoryWithCount[] {
  const posts = getAllPosts();
  const counters = new Map<string, number>();
  for (const post of posts) {
    counters.set(post.category, (counters.get(post.category) ?? 0) + 1);
  }
  return getAllCategories()
    .map((category) => ({ ...category, count: counters.get(category.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getTotalPostCount(): number {
  return getAllPosts().length;
}

/** 上一 / 下一篇文章：上一篇 = 更新的一篇，下一篇 = 更早的一篇 */
export interface AdjacentPosts {
  prev: PostMeta | null;
  next: PostMeta | null;
}

export function getAdjacentPosts(slug: string): AdjacentPosts {
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? posts[index - 1]! : null,
    next: index < posts.length - 1 ? posts[index + 1]! : null,
  };
}

/** 相关文章：同分类优先，再补充同标签文章 */
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const posts = getAllPosts().filter((post) => post.slug !== slug);
  const current = getAllPosts().find((post) => post.slug === slug);
  if (!current) return posts.slice(0, limit);

  const scored = posts.map((post) => {
    const sameCategory = post.category === current.category ? 2 : 0;
    const sharedTags = post.tags.filter((tag) => current.tags.includes(tag)).length;
    return { post, score: sameCategory + sharedTags };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}

/** 归档：按年份分组，用于未来的 /archive 页面 */
export function getArchiveByYear(): { year: string; posts: PostMeta[] }[] {
  const groups = new Map<string, PostMeta[]>();
  for (const post of getAllPosts()) {
    const year = post.date.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, items]) => ({ year, posts: items }));
}
