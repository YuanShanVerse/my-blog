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
      <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-3', className)}>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="group flex items-baseline gap-1.5 text-sm text-fg"
          >
            <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-fg">
              {category.name}
            </span>
            <span className="text-xs tabular-nums text-faint">{category.count}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-x-10 gap-y-1 sm:grid-cols-2', className)}>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className="group flex items-start justify-between gap-4 border-b border-line py-4 last:border-b-0"
        >
          <span className="min-w-0">
            <span className="flex items-baseline gap-2">
              <span className="text-[0.9375rem] font-medium text-fg transition-colors group-hover:text-accent">
                {category.name}
              </span>
              <span className="text-xs tabular-nums text-faint">{category.count} 篇</span>
            </span>
            <span className="mt-1 line-clamp-2 block text-[0.8125rem] leading-relaxed text-muted">
              {category.description}
            </span>
          </span>
          <span className="mt-1 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
