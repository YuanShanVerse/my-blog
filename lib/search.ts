import { getAllPostsWithBody } from '@/lib/posts';
import { stripMarkdown } from '@/lib/utils';

/**
 * 搜索索引。
 * 构建期生成为静态的 /search-index.json，浏览器端只在第一次打开搜索时才请求它，
 * 所以不会拖慢任何页面的首屏。索引体积可控（每篇约 1～2KB）。
 */

export interface SearchRecord {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  tags: string[];
  date: string;
  readingTime: number;
  /** 正文里出现的 h2 / h3，命中权重较高 */
  headings: string[];
  /** 去掉 Markdown 语法后的正文纯文本 */
  body: string;
}

export interface SearchIndex {
  generatedAt: string;
  count: number;
  posts: SearchRecord[];
}

const HEADING_RE = /^#{2,3}\s+(.+)$/gm;
const BODY_LIMIT = 1200;

function extractHeadings(markdown: string): string[] {
  return [...markdown.matchAll(HEADING_RE)].map((match) => match[1]!.trim()).filter(Boolean);
}

/** 生成全站搜索索引（标题 / 摘要 / 正文 / 分类 / 标签） */
export function buildSearchIndex(): SearchIndex {
  const posts = getAllPostsWithBody().map((post) => {
    const body = stripMarkdown(post.body ?? '');
    return {
      slug: post.slug,
      title: post.title,
      description: post.description,
      category: post.category,
      categoryName: post.categoryName,
      tags: post.tags,
      date: post.date,
      readingTime: post.readingTime,
      headings: extractHeadings(post.body ?? ''),
      body: body.slice(0, BODY_LIMIT),
    } satisfies SearchRecord;
  });

  return {
    generatedAt: new Date().toISOString(),
    count: posts.length,
    posts,
  };
}
