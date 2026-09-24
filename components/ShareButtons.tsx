'use client';

import { useState } from 'react';

import { CheckIcon, LinkIcon } from '@/components/Icons';

/** 分享：复制链接 + 常用平台。纯文字，默认折叠为一行，不打断阅读。 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
      <span className="text-faint">分享</span>

      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
        {copied ? '已复制链接' : '复制链接'}
      </button>

      <a
        href={`https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-fg"
      >
        微博
      </a>

      <a
        href={`https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-fg"
      >
        X
      </a>

      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-fg"
      >
        Telegram
      </a>
    </div>
  );
}
