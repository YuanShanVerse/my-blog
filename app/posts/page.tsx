import type { Metadata } from 'next';

import { PostExplorer } from '@/components/PostExplorer';
import { getAllPosts } from '@/lib/posts';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: '文章',
  description: `全部文章，按时间倒序排列。共 ${getAllPosts().length} 篇，支持分类筛选与关键词搜索。`,
  alternates: { canonical: '/posts' },
};

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div className="container-page py-14 sm:py-20">
      <header className="max-w-reading">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">文章</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          共 {posts.length} 篇，按时间倒序排列。可以用分类筛选或关键词搜索，也可以随时按{' '}
          <kbd className="rounded border border-line px-1.5 py-0.5 font-sans text-[0.625rem]">⌘</kbd>{' '}
          <kbd className="rounded border border-line px-1.5 py-0.5 font-sans text-[0.625rem]">K</kbd>{' '}
          打开全站搜索（含正文）。
        </p>
      </header>

      <PostExplorer posts={posts} perPage={site.postsPerPage} className="mt-12" />
    </div>
  );
}
