import type { Metadata } from 'next';
import Link from 'next/link';

import { MountainMark, Wordmark } from '@/components/BrandMark';
import { CategoryList } from '@/components/CategoryList';
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
      <h2 className="t-section">{title}</h2>
      <div className="mt-6 space-y-5 text-[0.9375rem] leading-[2] text-muted">{children}</div>
    </section>
  );
}

/**
 * 关于页。
 * 先给品牌，再给一段自述，然后才是分节的信息。
 * 不做头像卡片、不做简历式排版 —— 让它读起来像一篇文章。
 */
export default function AboutPage() {
  const categories = getCategoriesWithCount();
  const total = getTotalPostCount();

  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-reading">
        <header>
          <MountainMark className="h-10 w-10 text-fg" />
          {/*
            整页没有文字标题（视觉标题是字标 SVG），所以必须把字标放进 h1，
            再补一段仅供读屏与搜索引擎识别的文本。h1 用 flex 包裹，
            避免 inline SVG 在块级父元素里产生基线空隙。
          */}
          <h1 className="mt-8 flex">
            <Wordmark className="w-[clamp(152px,32vw,248px)]" />
            <span className="sr-only">关于</span>
          </h1>
          <p className="mt-7 font-mono text-[0.6875rem] tracking-[0.44em] text-faint">
            {site.nameEn}
          </p>
        </header>

        <div className="mt-14 space-y-6 text-[1.0625rem] leading-[2.05]">
          <p>{site.intro.lead}</p>
          <p className="text-muted">{site.intro.body}</p>
          <p className="text-muted">{site.author.bio}</p>
        </div>

        <div className="mt-20 space-y-14">
          <Block title="在写什么">
            <p>目前主要写这几类内容，一共 {total} 篇。每个分类都有独立的入口：</p>
            <CategoryList categories={categories} variant="inline" className="!mt-6" />
          </Block>

          <Block title="现在" id="now">
            <NowBlock />
          </Block>

          <Block title="联系">
            <p>
              {contacts.email
                ? '如果你想聊点什么，邮件是最可靠的方式。也欢迎在留言板留个脚印。'
                : '如果你想聊点什么，欢迎在 GitHub 或留言板找我。'}
            </p>
            <ul className="space-y-3 pt-1 text-sm">
              {contacts.email && (
                <li>
                  <a href={`mailto:${contacts.email}`} className="link">
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
                    className="link"
                  >
                    GitHub
                  </a>
                </li>
              )}
              <li>
                <Link href="/guestbook" className="link">
                  留言板
                </Link>
              </li>
              <li>
                <a href="/rss.xml" className="link">
                  RSS 订阅
                </a>
                <span className="ml-3 text-faint">
                  {absoluteUrl('/rss.xml').replace(/^https?:\/\//, '')}
                </span>
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
              <p className="text-[0.875rem]">
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
