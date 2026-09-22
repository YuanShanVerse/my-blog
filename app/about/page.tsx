import type { Metadata } from 'next';
import Link from 'next/link';

import { CategoryList } from '@/components/CategoryList';
import { GitHubIcon, MailIcon, RssIcon } from '@/components/Icons';
import { NowBlock } from '@/components/NowBlock';
import { getCategoriesWithCount, getTotalPostCount } from '@/lib/posts';
import { absoluteUrl, contacts, site } from '@/lib/site';

export const metadata: Metadata = {
  title: '关于',
  description: `关于 ${site.author.name}：在写什么、最近在做什么，以及如何联系。`,
  alternates: { canonical: '/about' },
};

function Block({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-8">
      <h2 className="text-2xs uppercase tracking-[0.2em] text-faint">{title}</h2>
      <div className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  const categories = getCategoriesWithCount();
  const total = getTotalPostCount();

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-reading">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {site.author.name}
          </h1>
          <p className="mt-3 text-base text-fg">{site.tagline}</p>
        </header>

        <div className="mt-12 space-y-10">
          <Block title="About Me">
            <p>{site.intro.lead}</p>
            <p>{site.intro.body}</p>
            <p>{site.author.bio}</p>
          </Block>

          <Block title="What I Write About">
            <p>
              目前主要写这几类内容，一共 {total} 篇。每个分类都有独立的入口：
            </p>
            <CategoryList categories={categories} variant="inline" className="!mt-5" />
          </Block>

          <Block title="Now" id="now">
            <NowBlock />
          </Block>

          <Block title="Contact">
            <p>
              {contacts.email
                ? '如果你想聊点什么，邮件是最可靠的方式。也欢迎在留言板留个脚印。'
                : '如果你想聊点什么，欢迎在 GitHub 或留言板找我。'}
            </p>
            <ul className="space-y-2.5">
              {contacts.email && (
                <li>
                  <a
                    href={`mailto:${contacts.email}`}
                    className="inline-flex items-center gap-2 text-fg transition-colors hover:text-accent"
                  >
                    <MailIcon className="h-4 w-4 text-faint" />
                    {contacts.email}
                  </a>
                </li>
              )}
              {contacts.github && (
                <li>
                  <a
                    href={contacts.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-fg transition-colors hover:text-accent"
                  >
                    <GitHubIcon className="h-4 w-4 text-faint" />
                    GitHub
                  </a>
                </li>
              )}
              <li>
                <Link
                  href="/guestbook"
                  className="inline-flex items-center gap-2 text-fg transition-colors hover:text-accent"
                >
                  <span className="w-4 text-center text-faint">✎</span>
                  留言板
                </Link>
              </li>
              <li>
                <Link
                  href="/rss.xml"
                  className="inline-flex items-center gap-2 text-fg transition-colors hover:text-accent"
                >
                  <RssIcon className="h-4 w-4 text-faint" />
                  RSS 订阅（{absoluteUrl('/rss.xml').replace(/^https?:\/\//, '')}）
                </Link>
              </li>
            </ul>
          </Block>

          <Block title="关于本站">
            <p>
              这个站点用 Markdown 写作、Git 管理、Next.js
              静态生成，构建产物是纯静态文件。没有数据库，没有第三方统计脚本，尽量少的
              JavaScript —— 目的是让它能被我长期维护下去。
            </p>
            {contacts.repo && (
              <p className="text-[0.875rem] text-faint">
                文章源文件在 {contacts.repo}/tree/main/content/posts，欢迎在 GitHub
                上看到错别字就提 issue。
              </p>
            )}
          </Block>
        </div>
      </div>
    </div>
  );
}
