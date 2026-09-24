import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArticleEnhancements } from '@/components/ArticleEnhancements';
import { BackToTop } from '@/components/BackToTop';
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, EditIcon } from '@/components/Icons';
import { PostListItem } from '@/components/PostListItem';
import { ReadingProgress } from '@/components/ReadingProgress';
import { Section } from '@/components/Section';
import { ShareButtons } from '@/components/ShareButtons';
import { TableOfContents } from '@/components/TableOfContents';
import { renderMarkdown } from '@/lib/markdown';
import {
  getAdjacentPosts,
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
  type PostMeta,
} from '@/lib/posts';
import { absoluteUrl, repoFileUrl, site } from '@/lib/site';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** 构建期把每篇文章预渲染成静态 HTML */
export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: '文章不存在' };
  }

  const url = absoluteUrl(`/posts/${post.slug}`);
  const author = post.author || site.author.name;
  // 文章没配 cover 时用站点默认分享图，保证每篇文章分享出去都有预览图
  const ogImage = absoluteUrl(post.cover ?? '/og.png');

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: author }],
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [author],
      tags: post.tags,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

function ArticleFooterNav({ post }: { post: PostMeta }) {
  const { prev, next } = getAdjacentPosts(post.slug);
  if (!prev && !next) return null;

  return (
    <nav
      className="mt-20 grid gap-px border-y border-line sm:grid-cols-2"
      aria-label="上下篇导航"
    >
      {[
        { item: prev, label: '上一篇', align: 'left' as const, Icon: ArrowLeftIcon },
        { item: next, label: '下一篇', align: 'right' as const, Icon: ArrowRightIcon },
      ].map(({ item, label, align, Icon }) => (
        <div
          key={label}
          className={
            align === 'right'
              ? 'sm:border-l sm:border-line'
              : 'border-b border-line sm:border-b-0'
          }
        >
          {item ? (
            <Link
              href={`/posts/${item.slug}`}
              className="group flex flex-col gap-2 px-1 py-6 transition-colors"
            >
              <span className="flex items-center gap-1.5 text-xs text-faint">
                {align === 'left' && <Icon className="h-3 w-3" />}
                {label}
                {align === 'right' && <Icon className="h-3 w-3" />}
              </span>
              <span className="font-serif text-[0.9375rem] font-bold leading-snug text-fg underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-accent">
                {item.title}
              </span>
              <span className="t-meta tabular-nums">{formatDate(item.date)}</span>
            </Link>
          ) : (
            <div className="px-1 py-6 text-xs text-faint">没有更多了</div>
          )}
        </div>
      ))}
    </nav>
  );
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const { html, toc } = await renderMarkdown(post.body, new URL(site.url).host);
  const related = getRelatedPosts(post.slug, 3);
  const author = post.author || site.author.name;
  const updatedOn = post.updated && post.updated !== post.date ? post.updated : null;
  const canonical = absoluteUrl(`/posts/${post.slug}`);
  const sourceUrl = repoFileUrl(`content/posts/${post.slug}.md`);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@type': 'Person', name: author },
    publisher: { '@type': 'Person', name: site.author.name },
    articleSection: post.categoryName,
    keywords: post.tags.join(', '),
    wordCount: post.words,
    timeRequired: `PT${post.readingTime}M`,
    inLanguage: site.lang,
    ...(post.cover ? { image: absoluteUrl(post.cover) } : {}),
  };

  return (
    <>
      <ReadingProgress />
      <BackToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="container-page pt-20 sm:pt-28">
        {/*
          正文栏固定 42.5rem（680px ≈ 38 字/行），右侧留一条窄目录。
          容器内容宽度是 55rem（60rem − 左右各 2.5rem），
          所以目录栏取 10rem、列间距 2rem，正好把 680px 让给正文。
        */}
        <div className="grid gap-16 lg:grid-cols-[minmax(0,42.5rem)_10rem] lg:justify-center lg:gap-8">
          <article className="min-w-0">
            {/*
              元信息在标题之前：先交代「这是什么时候、写的是哪一类」，
              再进入标题。也让标题上方不需要任何装饰元素。
            */}
            <header>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <Link
                  href={`/categories/${post.category}`}
                  className="t-meta transition-colors hover:text-fg"
                >
                  {post.categoryName}
                </Link>
                <time dateTime={formatDate(post.date, 'iso')} className="t-meta tabular-nums">
                  {formatDate(post.date, 'long')}
                </time>
                {updatedOn && (
                  <span className="t-meta tabular-nums">更新于 {formatDate(updatedOn, 'long')}</span>
                )}
                <span className="t-meta inline-flex items-center gap-1.5">
                  <ClockIcon className="h-3 w-3" />约 {post.readingTime} 分钟
                </span>
              </div>

              <h1 className="t-article mt-7">{post.title}</h1>

              {post.description && (
                <p className="t-lead mt-7 max-w-reading">{post.description}</p>
              )}
            </header>

            {/* 移动端折叠目录 */}
            <div className="mt-16">
              <TableOfContents items={toc} variant="mobile" />
              <ArticleEnhancements html={html} />
            </div>

            {/* 标签 */}
            {post.tags.length > 0 && (
              <div className="mt-16 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-line pt-6">
                <span className="text-xs text-faint">标签</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/posts?tag=${encodeURIComponent(tag)}`}
                    className="text-sm text-muted transition-colors hover:text-fg"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* 分享 / 源文件 */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
              <ShareButtons url={canonical} title={post.title} />
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  在 GitHub 上编辑本文
                </a>
              )}
            </div>

            <ArticleFooterNav post={post} />
          </article>

          {/* 桌面端目录 */}
          <TableOfContents items={toc} variant="desktop" />

          {/* 相关文章：与正文栏同宽同列，不另起一套对齐 */}
          {related.length > 0 && (
            <div className="lg:col-start-1">
              <Section title="相关文章">
                <div className="divide-list">
                  {related.map((item) => (
                    <PostListItem key={item.slug} post={item} className="py-5" />
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
