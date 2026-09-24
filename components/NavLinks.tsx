'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { mainNav } from '@/lib/site';
import { cn } from '@/lib/utils';

/** 桌面端主导航：只有三项，当前页用一条 1px 细线标记，不用背景色块 */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-7 md:flex" aria-label="主导航">
      {mainNav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative py-1 text-sm transition-colors',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {item.label}
            <span
              className={cn(
                'absolute inset-x-0 bottom-0 h-px origin-left bg-fg transition-transform duration-200',
                active ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
