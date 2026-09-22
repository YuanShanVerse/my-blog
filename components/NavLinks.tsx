'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { mainNav } from '@/lib/site';
import { cn } from '@/lib/utils';

/** 桌面端主导航，当前页用「下划线浮起」的方式标记（不使用背景色块） */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
      {mainNav.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative rounded-md px-2.5 py-1.5 text-sm transition-colors',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {item.label}
            <span
              className={cn(
                'absolute inset-x-2.5 -bottom-px h-px origin-left bg-fg transition-transform duration-200',
                active ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
