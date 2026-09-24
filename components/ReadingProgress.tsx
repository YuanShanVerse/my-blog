'use client';

import { useEffect, useRef } from 'react';

/**
 * 顶部阅读进度条：2px 细线，用 transform 驱动（不触发布局计算）。
 * 这是全站唯一的「滚动特效」，克制到几乎注意不到。
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      bar.style.transform = `scaleX(${progress})`;
      bar.style.opacity = progress > 0.005 ? '1' : '0';
    };

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full origin-left bg-fg opacity-0 transition-opacity duration-300"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
