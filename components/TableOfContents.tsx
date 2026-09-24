'use client';

import { useEffect, useState } from 'react';

import type { TocItem } from '@/lib/markdown';
import { cn } from '@/lib/utils';

/**
 * 文章目录。
 * - desktop：正文右侧吸顶显示，并高亮当前阅读的小节
 * - mobile：折叠在正文上方，展开后才占空间
 *
 * 两种形态共用一个组件，避免目录数据重复计算。
 */
export function TableOfContents({
  items,
  variant,
}: {
  items: TocItem[];
  variant: 'desktop' | 'mobile';
}) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (variant !== 'desktop' || items.length === 0) return;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // 只在视口上方约 1/3 的带状区域里判断「当前小节」
      { rootMargin: '-80px 0px -68% 0px', threshold: [0, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items, variant]);

  if (items.length < 2) return null;

  const list = (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                '-ml-px block border-l py-0.5 pr-2 text-[0.8125rem] leading-snug transition-colors',
                item.depth === 3 ? 'pl-5' : 'pl-3',
                active ? 'border-fg text-fg' : 'border-line text-muted hover:text-fg',
              )}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (variant === 'mobile') {
    return (
      <details className="mb-12 border-y border-line py-4 lg:hidden">
        <summary className="flex cursor-pointer items-baseline justify-between text-sm text-muted">
          本文目录
          <span className="t-meta">{items.length} 节</span>
        </summary>
        <div className="mt-4">{list}</div>
      </details>
    );
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
        <p className="mb-4 text-xs text-faint">目录</p>
        {list}
      </div>
    </aside>
  );
}
