import Link from 'next/link';

import type { CategoryWithCount } from '@/lib/posts';
import { cn } from '@/lib/utils';

/**
 * 分类列表。
 * 用「名称 + 数量 + 一句话说明」的文本网格呈现，不做卡片、不加阴影，
 * 保持和正文一致的克制感。
 */
export function CategoryList({
  categories,
  variant = 'grid',
  className,
}: {
  categories: CategoryWithCount[];
  variant?: 'grid' | 'inline';
  className?: string;
}) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-baseline gap-x-7 gap-y-3', className)}>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="group flex items-baseline gap-2 text-sm text-fg"
          >
            <span className="underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-accent">
              {category.name}
            </span>
            <span className="t-meta tabular-nums">{category.count}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-x-14 sm:grid-cols-2', className)}>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className="group flex items-baseline justify-between gap-6 border-b border-line py-5"
        >
          <span className="min-w-0">
            <span className="flex items-baseline gap-3">
              <span className="font-serif text-base font-bold text-fg">{category.name}</span>
              <span className="t-meta tabular-nums">{category.count} 篇</span>
            </span>
            <span className="mt-1.5 line-clamp-2 block text-[0.8125rem] leading-relaxed text-muted">
              {category.description}
            </span>
          </span>
          <span className="shrink-0 text-xs text-faint opacity-0 transition-opacity group-hover:opacity-100">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
