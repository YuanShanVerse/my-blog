import Link from 'next/link';

import { GitHubIcon, MailIcon, RssIcon } from '@/components/Icons';
import { mainNav, site } from '@/lib/site';

/** 页脚：极简三行，把出口（RSS / GitHub / Email）留给真正想关注的人 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm text-muted">
            © {year} {site.author.name} · {site.name}
          </p>
          <p className="text-xs text-faint">
            以 Markdown 写作，用 Next.js 构建 ·{' '}
            <Link href="/rss.xml" className="link-muted">
              RSS
            </Link>{' '}
            ·{' '}
            <Link href="/sitemap.xml" className="link-muted">
              Sitemap
            </Link>
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted" aria-label="页脚导航">
          {mainNav.slice(1).map((item) => (
            <Link key={item.href} href={item.href} className="link-muted">
              {item.label}
            </Link>
          ))}
          <span className="h-3 w-px bg-line" aria-hidden="true" />
          <a
            href={site.author.github}
            target="_blank"
            rel="noopener noreferrer"
            className="link-muted inline-flex items-center gap-1.5"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            GitHub
          </a>
          <a
            href={`mailto:${site.author.email}`}
            className="link-muted inline-flex items-center gap-1.5"
          >
            <MailIcon className="h-3.5 w-3.5" />
            Email
          </a>
          <Link href="/rss.xml" className="link-muted inline-flex items-center gap-1.5">
            <RssIcon className="h-3.5 w-3.5" />
            RSS
          </Link>
        </nav>
      </div>
    </footer>
  );
}
