'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 文章正文的渐进增强（只做三件事）：
 * 1. 给每个代码块注入「复制」按钮
 * 2. 点击图片放大查看
 * 3. Esc 关闭大图
 *
 * 这些都是纯增强：即使 JS 没有执行，正文依然是完整的静态 HTML。
 */
export function ArticleEnhancements({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  /* 代码复制按钮 */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanups: (() => void)[] = [];

    container.querySelectorAll<HTMLElement>('figure.code-block').forEach((figure) => {
      if (figure.querySelector('.copy-code')) return;
      const code = figure.querySelector('pre')?.textContent ?? '';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.textContent = '复制';
      button.setAttribute('aria-label', '复制代码');

      let timer = 0;
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = '已复制';
          button.dataset['copied'] = 'true';
        } catch {
          button.textContent = '复制失败';
        }
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          button.textContent = '复制';
          delete button.dataset['copied'];
        }, 1800);
      };

      button.addEventListener('click', onClick);
      figure.appendChild(button);

      cleanups.push(() => {
        window.clearTimeout(timer);
        button.removeEventListener('click', onClick);
        button.remove();
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [html]);

  /* 图片点击放大 */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName !== 'IMG') return;
      const src = target.getAttribute('src');
      if (src) setLightboxSrc(src);
    };

    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, []);

  /* Esc 关闭大图 */
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxSrc(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lightboxSrc]);

  return (
    <>
      <div ref={containerRef} className="prose" dangerouslySetInnerHTML={{ __html: html }} />

      {lightboxSrc && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxSrc} alt="" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </>
  );
}
