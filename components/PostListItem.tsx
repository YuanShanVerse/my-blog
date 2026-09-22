import Link from 'next/link';

import { ArrowRightIcon } from '@/components/Icons';
import type { PostMeta } from '@/lib/posts';
import { cn, formatDate } from '@/lib/utils';

/**
 * 文章列表项 —— 全站唯一的列表样式。
 * 首页、文章列表、分类页、相关文章都复用它，保证视觉与信息结构完全一致。
 */
export function PostListItem({
  post,
  showCategory = true,
  showDescription = true,
  className,
}: {
  post: PostMeta;
  showCategory?: boolean;
  showDescription?: boolean;
  className?: string;
}) {
  return (
    <article className={cn('group', className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs uppercase tracking-[0.14em] text-faint">
        {showCategory && (
          <>
            <Link
              href={`/categories/${post.category}`}
              className="transition-colors hover:text-fg"
              tabIndex={-1}
            >
              {post.categoryName}
            </Link>
            <span aria-hidden="true">·</span>
          </>
        )}
        <time dateTime={formatDate(post.date, 'iso')} className="tabular-nums">
          {formatDate(post.date)}
        </time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime} min read</span>
      </div>

      <h3 className="mt-2.5 text-[1.0625rem] font-semibold leading-snug tracking-tight">
        <Link
          href={`/posts/${post.slug}`}
          className="text-fg decoration-line decoration-1 underline-offset-4 transition-colors group-hover:underline"
        >
          {post.title}
        </Link>
      </h3>

      {showDescription && post.description && (
        <p className="mt-2 line-clamp-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          {post.description}
        </p>
      )}

      <p className="mt-2.5 flex items-center gap-1 text-xs text-faint transition-colors group-hover:text-fg">
        阅读文章
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </p>
    </article>
  );
}
