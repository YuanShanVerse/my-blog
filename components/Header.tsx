import Link from 'next/link';

import { MountainMark, Wordmark } from '@/components/BrandMark';
import { MobileNav } from '@/components/MobileNav';
import { NavLinks } from '@/components/NavLinks';
import { SearchButton } from '@/components/SearchButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { site } from '@/lib/site';

/** 站点顶栏：站标 + 三项导航 + 搜索 + 主题。固定 56px，不做滚动收缩。 */
export function Header() {
  return (
    <header className="site-header sticky top-0 z-40 border-b border-line">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 text-fg">
          <MountainMark className="h-[1.05rem] w-[1.05rem] shrink-0" />
          <Wordmark className="h-[1.3rem] w-auto" />
          <span className="hidden font-mono text-[0.625rem] tracking-[0.3em] text-faint sm:inline">
            {site.nameEn}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLinks />
          <span className="mx-1.5 hidden h-4 w-px bg-line md:block" aria-hidden="true" />
          <SearchButton />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
