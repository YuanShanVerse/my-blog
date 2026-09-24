'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CloseIcon, SearchIcon } from '@/components/Icons';
import { OPEN_SEARCH_EVENT } from '@/lib/events';
import type { SearchIndex, SearchRecord } from '@/lib/search';
import { cn, formatDate } from '@/lib/utils';

/**
 * 全站搜索面板（Ctrl / ⌘ + K）。
 *
 * 索引是构建期生成的静态文件 /search-index.json，首次打开面板时才请求，
 * 所以不会给任何页面增加首屏负担；之后常驻内存，输入即过滤，无网络往返。
 */

const FIELD_WEIGHTS = {
  title: 10,
  tags: 6,
  category: 4,
  headings: 4,
  description: 3,
  body: 1,
} as const;

interface ScoredResult {
  post: SearchRecord;
  score: number;
  snippet: string;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,，]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function haystackOf(post: SearchRecord): Record<keyof typeof FIELD_WEIGHTS, string> {
  return {
    title: post.title.toLowerCase(),
    tags: post.tags.join(' ').toLowerCase(),
    category: `${post.category} ${post.categoryName}`.toLowerCase(),
    headings: post.headings.join(' ').toLowerCase(),
    description: post.description.toLowerCase(),
    body: post.body.toLowerCase(),
  };
}

function buildSnippet(post: SearchRecord, tokens: string[]): string {
  const body = post.body;
  const lower = body.toLowerCase();
  let index = -1;
  for (const token of tokens) {
    const found = lower.indexOf(token);
    if (found !== -1 && (index === -1 || found < index)) index = found;
  }
  if (index === -1) return post.description;
  const start = Math.max(0, index - 40);
  const end = Math.min(body.length, index + 70);
  return `${start > 0 ? '…' : ''}${body.slice(start, end)}${end < body.length ? '…' : ''}`;
}

function scorePost(post: SearchRecord, tokens: string[]): ScoredResult | null {
  const fields = haystackOf(post);
  let score = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS) as [
      keyof typeof FIELD_WEIGHTS,
      number,
    ][]) {
      if (fields[field].includes(token)) tokenScore += weight;
    }
    // 所有关键词都必须命中（AND 语义），否则视为不匹配
    if (tokenScore === 0) return null;
    score += tokenScore;
  }

  return { post, score, snippet: buildSnippet(post, tokens) };
}

function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (tokens.length === 0) return <>{text}</>;

  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, index) =>
        tokens.includes(part.toLowerCase()) ? (
          <mark key={index} className="bg-accent-soft text-fg">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const tokens = useMemo(() => tokenize(query), [query]);

  const results = useMemo<ScoredResult[]>(() => {
    if (!index) return [];
    if (tokens.length === 0) {
      return index.posts
        .slice(0, 5)
        .map((post) => ({ post, score: 0, snippet: post.description }));
    }
    return index.posts
      .map((post) => scorePost(post, tokens))
      .filter((item): item is ScoredResult => item !== null)
      .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
      .slice(0, 12);
  }, [index, tokens]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  /* 打开面板时按需加载索引 */
  useEffect(() => {
    if (!open || index || loading) return;
    setLoading(true);
    fetch('/search-index.json')
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<SearchIndex>;
      })
      .then((data) => setIndex(data))
      .catch(() => setError('搜索索引加载失败，请刷新页面重试。'))
      .finally(() => setLoading(false));
  }, [open, index, loading]);

  /* 全局快捷键 + 外部触发 */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  /* 打开时聚焦输入框 + 锁定背景滚动 */
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const go = (post: SearchRecord) => {
    close();
    router.push(`/posts/${post.slug}`);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      const target = results[activeIndex];
      if (target) {
        event.preventDefault();
        go(target.post);
      }
    }
  };

  return (
    <div
      className="overlay fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[10vh]"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="全站搜索"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl animate-fade-in border border-line bg-bg"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon className="h-4 w-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="搜索标题、正文、分类或标签…"
            className="h-12 w-full bg-transparent text-[0.9375rem] text-fg outline-none placeholder:text-faint"
            aria-label="搜索关键词"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" onClick={close} className="btn-ghost h-7 w-7 !px-0" aria-label="关闭搜索">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[54vh] overflow-y-auto overscroll-contain">
          {loading && <p className="px-4 py-8 text-center text-sm text-faint">正在加载索引…</p>}

          {error && <p className="px-4 py-8 text-center text-sm text-muted">{error}</p>}

          {!loading && !error && results.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted">没有找到匹配的文章</p>
              <p className="mt-1.5 text-xs text-faint">试试更短的关键词，或者用分类筛选</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <ul className="py-1.5">
              {tokens.length === 0 && (
                <li className="t-meta px-4 pb-2 pt-3">最近更新</li>
              )}
              {results.map((result, index) => (
                <li key={result.post.slug}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(result.post)}
                    className={cn(
                      'flex w-full flex-col gap-1 px-4 py-2.5 text-left transition-colors',
                      index === activeIndex ? 'bg-surface' : 'hover:bg-surface',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="t-meta">{result.post.categoryName}</span>
                      <span className="text-faint" aria-hidden="true">·</span>
                      <span className="t-meta tabular-nums">{formatDate(result.post.date)}</span>
                      <span className="text-faint" aria-hidden="true">·</span>
                      <span className="t-meta">{result.post.readingTime} min</span>
                    </span>
                    <span className="font-serif text-sm font-bold leading-snug text-fg">
                      <Highlight text={result.post.title} tokens={tokens} />
                    </span>
                    <span className="line-clamp-2 text-xs leading-relaxed text-muted">
                      <Highlight text={result.snippet} tokens={tokens} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <span className="t-meta flex items-center gap-3">
            <span>↑ ↓ 选择</span>
            <span>↵ 打开</span>
            <span>Esc 关闭</span>
          </span>
          {tokens.length > 0 && !loading && (
            <span className="t-meta flex items-center gap-1 text-muted">
              {results.length} 条结果
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
