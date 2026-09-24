import type { Metadata } from 'next';
import Link from 'next/link';

import { MountainMark, Wordmark } from '@/components/BrandMark';
import { PostListItem } from '@/components/PostListItem';
import { Section } from '@/components/Section';
import { getFeaturedPosts, getLatestPosts, getTotalPostCount } from '@/lib/posts';
import { absoluteUrl, contacts, site } from '@/lib/site';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** 站点结构化数据，帮助搜索引擎理解「这是一个个人博客」 */
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
  description: site.description,
  author: {
    '@type': 'Person',
    name: site.author.name,
    url: site.url,
    sameAs: [contacts.github].filter(Boolean),
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${absoluteUrl('/posts')}?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  const featured = getFeaturedPosts(site.featuredLimit);
  const latest = getLatestPosts(site.latestOnHome);
  const total = getTotalPostCount();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/*
        首屏：整屏只放品牌。
        一屏一件事 —— 不放社交图标、不放按钮、不放统计数据，留白就是内容的一部分。
      */}
      <section className="container-page flex min-h-[calc(100svh-3.5rem)] flex-col pb-8 pt-16 sm:pt-20">
        <div className="flex flex-1 flex-col justify-center py-12">
          <MountainMark className="h-14 w-14 text-fg" />

          {/*
            首屏的视觉标题是字标 SVG，所以把它放进 h1，
            再补一段仅供读屏与搜索引擎识别的站名，避免整页没有一级标题。
          */}
          <h1 className="mt-10 flex">
            <Wordmark className="w-[clamp(196px,44vw,432px)]" />
            <span className="sr-only">{site.nameEn}</span>
          </h1>

          <p className="mt-10 font-mono text-[0.6875rem] tracking-[0.44em] text-faint">
            {site.nameEn}
          </p>

          <p className="mt-7 max-w-[21rem] text-[0.9375rem] leading-[2] text-muted">
            {site.tagline}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-6 border-t border-line pt-5">
          <span className="t-meta tabular-nums">
            {total} 篇文章
            {latest[0] && ` · 最近更新于 ${formatDate(latest[0].date)}`}
          </span>
          <Link href="#latest" className="text-xs text-muted transition-colors hover:text-fg">
            最新文章 ↓
          </Link>
        </div>
      </section>

      <div className="container-page">
        {/* 最新文章 */}
        <Section id="latest" title="最新" moreHref="/posts" moreLabel="全部文章">
          <div className="divide-list">
            {latest.map((post) => (
              <PostListItem key={post.slug} post={post} className="py-6" />
            ))}
          </div>
        </Section>

        {/* 精选文章 */}
        {featured.length > 0 && (
          <Section title="精选" moreHref="/categories" moreLabel="按分类浏览">
            <div className="divide-list">
              {featured.map((post) => (
                <PostListItem key={post.slug} post={post} className="py-6" />
              ))}
            </div>
          </Section>
        )}

        {/* 关于 */}
        <Section title="关于" moreHref="/about" moreLabel="更多">
          <div className="max-w-reading space-y-5 text-[0.9375rem] leading-[2] text-muted">
            <p>{site.intro.lead}</p>
            <p>{site.intro.body}</p>
          </div>
        </Section>
      </div>
    </>
  );
}
