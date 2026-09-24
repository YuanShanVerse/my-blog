import Link from 'next/link';

import { SealGlyph } from '@/components/BrandMark';
import { allNav, contacts, site } from '@/lib/site';

/**
 * 页脚：左侧一枚朱砂印记 + 版权，右侧两组文字链接（导航 / 订阅）。
 * 印记是全站用到朱砂的三处之一（另两处是选区底色与正文链接下划线）。
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-32 border-t border-line">
      <div className="container-page flex flex-col gap-10 py-12 sm:flex-row sm:items-start sm:justify-between sm:gap-16">
        <div className="flex items-start gap-4">
          <span
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center bg-accent"
            aria-hidden="true"
          >
            <SealGlyph className="h-[0.7rem] w-auto text-bg" />
          </span>
          <div className="space-y-2">
            <p className="text-sm text-fg">
              {site.name} {site.nameEn}
            </p>
            <p className="text-sm text-muted">© {year} {site.author.name}</p>
            <p className="max-w-xs text-xs leading-relaxed text-faint">
              以 Markdown 写作，Git 管理，Next.js 静态生成。没有统计脚本。
            </p>
          </div>
        </div>

        <div className="flex gap-14">
          <nav className="flex flex-col gap-3 text-sm" aria-label="页脚导航">
            {allNav.map((item) => (
              <Link key={item.href} href={item.href} className="link-muted">
                {item.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-3 text-sm" aria-label="订阅与联系">
            {contacts.github && (
              <a
                href={contacts.github}
                target="_blank"
                rel="noopener noreferrer"
                className="link-muted"
              >
                GitHub
              </a>
            )}
            {/*
              rss.xml / sitemap.xml 是构建期产出的静态文件，不是 App Router 路由。
              这里必须用原生 <a>：用 next/link 会触发 RSC 预取（/rss.xml.txt），
              静态托管下必然 404，控制台会留下噪音。
            */}
            <a href="/rss.xml" className="link-muted">
              RSS
            </a>
            <a href="/sitemap.xml" className="link-muted">
              Sitemap
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
