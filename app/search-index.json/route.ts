import { buildSearchIndex } from '@/lib/search';

/**
 * 全站搜索索引：/search-index.json
 *
 * 构建期生成为静态 JSON，浏览器端只在第一次打开搜索面板时拉取一次，
 * 因此不影响任何页面的首屏性能；随着文章变多，索引会线性增长（每篇约 1～2KB）。
 */
export const dynamic = 'force-static';

export function GET(): Response {
  const index = buildSearchIndex();

  return new Response(JSON.stringify(index), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
