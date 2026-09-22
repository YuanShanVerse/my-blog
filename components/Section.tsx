import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowRightIcon } from '@/components/Icons';
import { cn } from '@/lib/utils';

/** 首页区块容器：统一标题样式与「更多」入口，避免每处各写一套 */
export function Section({
  title,
  hint,
  moreHref,
  moreLabel = '查看全部',
  children,
  className,
}: {
  title: string;
  hint?: string;
  moreHref?: string;
  moreLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mt-16', className)}>
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="text-2xs uppercase tracking-[0.2em] text-faint">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-fg"
          >
            {moreLabel}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {hint && <p className="-mt-2 mb-5 text-sm text-muted">{hint}</p>}
      {children}
    </section>
  );
}
