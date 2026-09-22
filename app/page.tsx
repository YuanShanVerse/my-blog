import type { Metadata } from 'next';
import Link from 'next/link';

import { CategoryList } from '@/components/CategoryList';
import { GitHubIcon, MailIcon, RssIcon } from '@/components/Icons';
import { NowBlock } from '@/components/NowBlock';
import { PostListItem } from '@/components/PostListItem';
import { Section } from '@/components/Section';
import { getCategoriesWithCount, getFeaturedPosts, getLatestPosts, getTotalPostCount } from '@/lib/posts';
import { absoluteUrl, contacts, site } from '@/lib/site';

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
  const categories = getCategoriesWithCount();
  const total = getTotalPostCount();

  return (
    <div className="container-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero：只有站名、一句话和几个出口，不做大 Banner */}
      <section className="max-w-reading pb-2 pt-16 sm:pt-24">
        <p className="text-2xs uppercase tracking-[0.24em] text-faint">{site.nameEn} · Personal Blog</p>
        <h1 className="mt-5 text-[2rem] font-semibold leading-tight tracking-tight sm:text-[2.5rem]">
          {site.name}
        </h1>
        <p className="mt-4 text-base text-fg sm:text-[1.0625rem]">{site.tagline}</p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{site.description}</p>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
          {contacts.github && (
            <a
              href={contacts.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              GitHub
            </a>
          )}
          {contacts.email && (
            <a
              href={`mailto:${contacts.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
            >
              <MailIcon className="h-3.5 w-3.5" />
              {contacts.email}
            </a>
          )}
          <Link href="/rss.xml" className="inline-flex items-center gap-1.5 transition-colors hover:text-fg">
            <RssIcon className="h-3.5 w-3.5" />
            RSS
          </Link>
          <span className="text-faint">共 {total} 篇文章</span>
        </div>
      </section>

      {/* 精选文章 */}
      {featured.length > 0 && (
        <Section title="精选" hint="挑了几篇自己比较满意的，从这里开始读也不错。">
          <div className="divide-list">
            {featured.map((post, index) => (
              <div key={post.slug} className="flex gap-5 py-7">
                <span className="mt-1 shrink-0 font-mono text-xs text-faint tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <PostListItem post={post} className="flex-1" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 最新文章 */}
      <Section title="最新文章" moreHref="/posts" moreLabel="全部文章">
        <div className="divide-list">
          {latest.map((post) => (
            <PostListItem key={post.slug} post={post} className="py-7" />
          ))}
        </div>
      </Section>

      {/* 分类 */}
      <Section title="分类" moreHref="/categories" moreLabel="全部分类">
        <CategoryList categories={categories} className="mt-1" />
      </Section>

      {/* Now */}
      <Section title="现在">
        <NowBlock />
      </Section>

      {/* 关于 */}
      <Section title="关于" moreHref="/about" moreLabel="了解更多">
        <div className="max-w-reading space-y-3 text-[0.9375rem] leading-relaxed text-muted">
          <p>{site.intro.lead}</p>
          <p>{site.intro.body}</p>
          <p>
            <Link href="/about" className="link">
              关于我 →
            </Link>
          </p>
        </div>
      </Section>
    </div>
  );
}
