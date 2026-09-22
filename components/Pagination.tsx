'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@/components/Icons';
import { cn } from '@/lib/utils';

/** 极简分页：上一页 / 页码 / 下一页 */
export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => {
    if (totalPages <= 7) return true;
    return value === 1 || value === totalPages || Math.abs(value - page) <= 1;
  });

  return (
    <nav
      className={cn('mt-10 flex items-center justify-between gap-4 border-t border-line pt-6', className)}
      aria-label="分页导航"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost gap-1.5 pl-0 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        上一页
      </button>

      <div className="flex items-center gap-1">
        {pages.map((value, index) => (
          <span key={value} className="flex items-center">
            {index > 0 && value - pages[index - 1]! > 1 && (
              <span className="px-1 text-xs text-faint">…</span>
            )}
            <button
              type="button"
              onClick={() => onChange(value)}
              aria-current={value === page ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 rounded-md px-2 text-sm tabular-nums transition-colors',
                value === page ? 'bg-surface font-medium text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {value}
            </button>
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost gap-1.5 pr-0 disabled:cursor-not-allowed disabled:opacity-40"
      >
        下一页
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}
