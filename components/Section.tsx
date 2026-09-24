import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * 首页区块容器：中文小标题 + 一条细线 + 「更多」入口。
 * 标题不做 uppercase、不做装饰图标 —— 秩序由细线和留白承担。
 */
export function Section({
  id,
  title,
  hint,
  moreHref,
  moreLabel = '全部',
  children,
  className,
}: {
  id?: string;
  title: string;
  hint?: string;
  moreHref?: string;
  moreLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('mt-24 scroll-mt-24 sm:mt-32', className)}>
      <div className="mb-7 flex items-baseline justify-between gap-6 border-b border-line pb-3">
        <h2 className="t-section">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="text-xs text-muted transition-colors hover:text-fg"
          >
            {moreLabel} →
          </Link>
        )}
      </div>
      {hint && <p className="-mt-3 mb-8 text-sm leading-relaxed text-muted">{hint}</p>}
      {children}
    </section>
  );
}
