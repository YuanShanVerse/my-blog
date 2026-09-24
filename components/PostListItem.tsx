import Link from 'next/link';

import type { PostMeta } from '@/lib/posts';
import { cn, formatDate } from '@/lib/utils';

/**
 * 文章列表项 —— 全站唯一的列表样式。
 *
 * 版式是「日期 ｜ 标题 ｜ 分类」三栏的一行文字，靠细线、留白与字体层级形成秩序，
 * 不做卡片、不写摘要、不加箭头。首页、文章列表、分类页、相关文章都复用它。
 */
export function PostListItem({
  post,
  showCategory = true,
  className,
}: {
  post: PostMeta;
  showCategory?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'group flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-8',
        className,
      )}
    >
      <time
        dateTime={formatDate(post.date, 'iso')}
        className="t-meta shrink-0 tabular-nums sm:w-[6.5rem]"
      >
        {formatDate(post.date)}
      </time>

      <h3 className="t-item min-w-0 flex-1">
        <Link
          href={`/posts/${post.slug}`}
          className="underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-accent"
        >
          {post.title}
        </Link>
      </h3>

      {showCategory && (
        <Link
          href={`/categories/${post.category}`}
          className="t-meta hidden shrink-0 transition-colors hover:text-fg sm:block"
          tabIndex={-1}
        >
          {post.categoryName}
        </Link>
      )}
    </article>
  );
}
