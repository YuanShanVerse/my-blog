import Link from 'next/link';

import { mainNav } from '@/lib/site';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-2xs uppercase tracking-[0.3em] text-faint">404</p>
      <h1 className="mt-6 text-xl font-semibold tracking-tight sm:text-2xl">
        这一页不存在，或者已经搬走了
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        链接可能过期了。可以回到首页，或者直接去文章列表翻翻看。
      </p>

      <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        {mainNav.map((item) => (
          <Link key={item.href} href={item.href} className="link-muted">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
