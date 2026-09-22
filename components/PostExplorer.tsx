'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { CloseIcon, SearchIcon } from '@/components/Icons';
import { Pagination } from '@/components/Pagination';
import { PostListItem } from '@/components/PostListItem';
import type { PostMeta } from '@/lib/posts';
import { cn } from '@/lib/utils';

/**
 * 文章浏览器：搜索 + 分类筛选 + 排序 + 分页。
 *
 * 全站文章数量在个人博客的量级下不会很大，这里直接把列表交给客户端过滤，
 * 换来「输入即筛选」的即时体验（无网络往返）；筛选状态同步到 URL，
 * 链接可以直接分享。文章量进一步增长后，可换成 /posts/page/[n] 的静态分页。
 */

type SortOrder = 'new' | 'old';

interface PostExplorerProps {
  posts: PostMeta[];
  perPage?: number;
  /** 锁定分类（分类详情页使用），此时不再显示分类筛选 */
  lockedCategory?: string;
  className?: string;
}

interface Filters {
  query: string;
  category: string;
  tag: string;
  sort: SortOrder;
  page: number;
}

const EMPTY_FILTERS: Filters = { query: '', category: '', tag: '', sort: 'new', page: 1 };

/**
 * 从 URL 读取筛选条件。
 * 只返回「确实存在」的字段 —— 否则 undefined 会覆盖掉 EMPTY_FILTERS 里的默认值
 * （曾经因此导致 page 变成 NaN、列表被 slice 成空数组）。
 */
function readFiltersFromUrl(): Partial<Filters> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: Partial<Filters> = {};

  const query = params.get('q');
  const category = params.get('category');
  const tag = params.get('tag');
  const sort = params.get('sort');
  const page = Number(params.get('page'));

  if (query) result.query = query;
  if (category) result.category = category;
  if (tag) result.tag = tag;
  if (sort === 'old' || sort === 'new') result.sort = sort;
  if (Number.isFinite(page) && page > 1) result.page = page;

  return result;
}

export function PostExplorer({ posts, perPage = 6, lockedCategory, className }: PostExplorerProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  /* 首次挂载时读取 URL 参数（用 window 而不是 useSearchParams，静态导出下不需要 Suspense 包裹） */
  useEffect(() => {
    const fromUrl = readFiltersFromUrl();
    setFilters({ ...EMPTY_FILTERS, ...fromUrl });
  }, []);

  /* 筛选状态同步到 URL：方便分享与刷新后保持视图 */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.sort !== 'new') params.set('sort', filters.sort);
    if (filters.page > 1) params.set('page', String(filters.page));
    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ''}`;
    window.history.replaceState(null, '', next);
  }, [filters]);

  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; count: number }>();
    for (const post of posts) {
      const existing = map.get(post.category);
      map.set(post.category, {
        slug: post.category,
        name: post.categoryName,
        count: (existing?.count ?? 0) + 1,
      });
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts]);

  const filtered = useMemo(() => {
    const tokens = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
    const activeCategory = lockedCategory ?? filters.category;

    const result = posts.filter((post) => {
      if (activeCategory && post.category !== activeCategory) return false;
      if (filters.tag && !post.tags.some((tag) => tag.toLowerCase() === filters.tag.toLowerCase())) {
        return false;
      }
      if (tokens.length === 0) return true;
      const haystack = [post.title, post.description, post.categoryName, post.tags.join(' ')]
        .join(' ')
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });

    return filters.sort === 'old' ? [...result].reverse() : result;
  }, [posts, filters, lockedCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(filters.page, totalPages);
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const patch = useCallback((changes: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...changes }));
  }, []);

  const hasActiveFilter = Boolean(
    filters.query || filters.tag || (!lockedCategory && filters.category),
  );

  return (
    <div className={className}>
      {/* 控制区 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative flex h-10 w-full items-center rounded-lg border border-line bg-surface px-3 transition-colors focus-within:border-faint sm:max-w-xs">
            <SearchIcon className="h-4 w-4 shrink-0 text-faint" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => patch({ query: event.target.value, page: 1 })}
              placeholder="搜索文章…"
              aria-label="搜索文章"
              className="h-full w-full bg-transparent pl-2.5 text-sm text-fg outline-none placeholder:text-faint"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => patch({ query: '', page: 1 })}
                aria-label="清除搜索"
                className="text-faint transition-colors hover:text-fg"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <div className="flex items-center gap-3 text-xs text-faint">
            <span className="tabular-nums">
              共 {filtered.length} 篇
              {totalPages > 1 && ` · 第 ${currentPage} / ${totalPages} 页`}
            </span>
            <span className="h-3 w-px bg-line" aria-hidden="true" />
            <button
              type="button"
              onClick={() => patch({ sort: filters.sort === 'new' ? 'old' : 'new', page: 1 })}
              className="transition-colors hover:text-fg"
            >
              {filters.sort === 'new' ? '最新优先' : '最早优先'}
            </button>
          </div>
        </div>

        {!lockedCategory && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => patch({ category: '', page: 1 })}
              className={cn('chip-plain', !filters.category && 'border-fg text-fg')}
            >
              全部
              <span className="ml-1.5 tabular-nums text-faint">{posts.length}</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() =>
                  patch({
                    category: filters.category === category.slug ? '' : category.slug,
                    page: 1,
                  })
                }
                className={cn('chip-plain', filters.category === category.slug && 'border-fg text-fg')}
              >
                {category.name}
                <span className="ml-1.5 tabular-nums text-faint">{category.count}</span>
              </button>
            ))}
          </div>
        )}

        {filters.tag && (
          <div className="flex items-center gap-2 text-xs text-muted">
            标签筛选：
            <button
              type="button"
              onClick={() => patch({ tag: '', page: 1 })}
              className="chip-plain border-fg text-fg"
            >
              #{filters.tag}
              <CloseIcon className="ml-1.5 h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* 列表 */}
      {visible.length > 0 ? (
        <div className="divide-list mt-8">
          {visible.map((post) => (
            <PostListItem key={post.slug} post={post} className="py-7" />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <p className="text-sm text-muted">没有找到匹配的文章</p>
          <p className="mt-1.5 text-xs text-faint">
            {hasActiveFilter ? '试试清除筛选条件' : '还没有发布任何文章'}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => setFilters({ ...EMPTY_FILTERS })}
              className="btn mt-5"
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onChange={(page) => {
          patch({ page });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
