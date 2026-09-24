import Link from 'next/link';

import { MountainMark } from '@/components/BrandMark';
import { allNav } from '@/lib/site';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-28 text-center">
      <MountainMark className="h-10 w-10 text-faint" />
      <p className="t-meta mt-8 tracking-[0.3em]">404</p>
      <h1 className="t-page mt-6">这一页不存在，或者已经搬走了</h1>
      <p className="t-lead mt-5 max-w-sm">
        链接可能过期了。可以回到首页，或者直接去文章列表翻翻看。
      </p>

      <nav className="mt-10 flex flex-wrap items-baseline justify-center gap-x-7 gap-y-3 text-sm">
        <Link href="/" className="link-muted">
          首页
        </Link>
        {allNav.map((item) => (
          <Link key={item.href} href={item.href} className="link-muted">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
