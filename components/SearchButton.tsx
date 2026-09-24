'use client';

import { useEffect, useState } from 'react';

import { SearchIcon } from '@/components/Icons';
import { openSearch } from '@/lib/events';
import { cn } from '@/lib/utils';

/** 搜索入口：点击或 Ctrl/⌘ + K 都能唤起同一个搜索面板 */
export function SearchButton({ className }: { className?: string }) {
  const [shortcut, setShortcut] = useState('Ctrl K');

  // 在挂载后判断平台，避免服务端 / 客户端渲染不一致
  useEffect(() => {
    if (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)) setShortcut('⌘ K');
  }, []);

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="搜索文章（快捷键 Ctrl 或 Command 加 K）"
      className={cn('btn-ghost h-8 gap-2 pr-1.5', className)}
    >
      <SearchIcon className="h-[1.05rem] w-[1.05rem]" />
      <span className="hidden text-xs text-faint lg:inline">搜索</span>
      <kbd className="hidden border border-line px-1.5 py-0.5 font-sans text-[0.625rem] leading-none text-faint lg:inline">
        {shortcut}
      </kbd>
    </button>
  );
}
