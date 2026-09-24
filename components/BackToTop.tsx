'use client';

import { useEffect, useState } from 'react';

import { ArrowUpIcon } from '@/components/Icons';

/** 返回顶部：滚动一段距离后才出现，小小的直角按钮 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="返回顶部"
      className={`fixed bottom-6 right-5 z-40 flex h-9 w-9 items-center justify-center border border-line bg-bg text-muted transition-all duration-200 hover:border-fg hover:text-fg ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ArrowUpIcon className="h-4 w-4" />
    </button>
  );
}
