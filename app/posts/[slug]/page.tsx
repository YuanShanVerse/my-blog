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
    <nav className="mt-14 grid gap-px overflow-hidden border-y border-line sm:grid-cols-2" aria-label="上下篇导航">
      {[
        { item: prev, label: '上一篇', align: 'left' as const, Icon: ArrowLeftIcon },
        { item: next, label: '下一篇', align: 'right' as const, Icon: ArrowRightIcon },
      ].map(({ item, label, align, Icon }) => (
        <div
          key={label}
          className={
            align === 'right'
              ? 'sm:text-right sm:border-l sm:border-line'
              : 'border-b border-line sm:border-b-0'
          }
        >
          {item ? (
            <Link
              href={`/posts/${item.slug}`}
              className="group flex flex-col gap-1.5 px-1 py-5 transition-colors"
            >
              <span
                className={`flex items-center gap-1.5 text-2xs uppercase tracking-widest text-faint ${
                  align === 'right' ? 'sm:justify-end' : ''
                }`}
              >
                {align === 'left' && <Icon className="h-3 w-3" />}
                {label}
                {align === 'right' && <Icon className="h-3 w-3" />}
              </span>
              <span className="text-sm font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                {item.title}
              </span>
              <span className="text-xs tabular-nums text-faint">{formatDate(item.date)}</span>
            </Link>
          ) : (
            <div className="px-1 py-5 text-xs text-faint">没有更多了</div>
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

      <div className="container-page pt-12 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,45rem)_13rem] lg:justify-center lg:gap-20">
          <article className="min-w-0">
            {/* 面包屑 */}
            <nav className="flex items-center gap-2 text-xs text-faint" aria-label="面包屑">
              <Link href="/posts" className="transition-colors hover:text-fg">
                文章
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href={`/categories/${post.category}`}
                className="transition-colors hover:text-fg"
              >
                {post.categoryName}
              </Link>
            </nav>

            <header className="mt-6">
              <h1 className="text-[1.625rem] font-semibold leading-[1.35] tracking-tight sm:text-[2rem]">
                {post.title}
              </h1>

              {post.description && (
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {post.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line py-3 text-xs text-faint">
                <Link
                  href={`/categories/${post.category}`}
                  className="chip !py-0.5 !text-2xs hover:border-faint hover:text-fg"
                >
                  {post.categoryName}
                </Link>
                <time dateTime={formatDate(post.date, 'iso')} className="tabular-nums">
                  {formatDate(post.date, 'long')}
                </time>
                {updatedOn && (
                  <span className="tabular-nums">更新于 {formatDate(updatedOn, 'long')}</span>
                )}
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  约 {post.readingTime} 分钟
                </span>
                <span>{author}</span>
              </div>
            </header>

            {/* 移动端折叠目录 */}
            <div className="mt-10">
              <TableOfContents items={toc} variant="mobile" />
              <ArticleEnhancements html={html} />
            </div>

            {/* 标签 */}
            {post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-line pt-6">
                <span className="text-2xs uppercase tracking-[0.2em] text-faint">标签</span>
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/posts?tag=${encodeURIComponent(tag)}`} className="chip-plain">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* 分享 / 源文件 */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
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
        </div>

        {related.length > 0 && (
          <div className="mx-auto max-w-[45rem] lg:mx-0">
            <Section title="相关文章">
              <div className="divide-list">
                {related.map((item) => (
                  <PostListItem key={item.slug} post={item} className="py-6" />
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </>
  );
}
