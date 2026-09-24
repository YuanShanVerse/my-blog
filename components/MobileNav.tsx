'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CloseIcon, MenuIcon, SearchIcon } from '@/components/Icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { openSearch } from '@/lib/events';
import { allNav } from '@/lib/site';
import { cn } from '@/lib/utils';

/** 移动端汉堡菜单：展开后是简洁的文字列表，不做全屏遮罩动画 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 路由变化时自动收起
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? '关闭菜单' : '打开菜单'}
        className="btn-ghost h-8 w-8 !px-0"
      >
        {open ? (
          <CloseIcon className="h-[1.05rem] w-[1.05rem]" />
        ) : (
          <MenuIcon className="h-[1.05rem] w-[1.05rem]" />
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-bg px-6 pb-5 pt-1">
          <nav className="flex flex-col" aria-label="移动端导航">
            {allNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'border-b border-line py-3.5 text-base last:border-0',
                    active ? 'text-fg' : 'text-muted',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openSearch();
              }}
              className="btn-ghost gap-2 pl-0"
            >
              <SearchIcon className="h-4 w-4" />
              搜索
            </button>
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}
