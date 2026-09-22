import Link from 'next/link';

import { MobileNav } from '@/components/MobileNav';
import { NavLinks } from '@/components/NavLinks';
import { SearchButton } from '@/components/SearchButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { site } from '@/lib/site';

/** 站点顶部导航：左站名、右导航 + 搜索 + 主题切换。sticky 但不做花哨的滚动收缩。 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-baseline gap-2 text-[0.9375rem] font-medium tracking-tight text-fg"
        >
          <span>{site.name}</span>
          <span className="hidden text-2xs uppercase tracking-[0.18em] text-faint sm:inline">
            {site.nameEn}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLinks />
          <span className="mx-1 hidden h-4 w-px bg-line md:block" aria-hidden="true" />
          <SearchButton />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
