import type { MetadataRoute } from 'next';

import { getCategoriesWithCount, getAllPosts } from '@/lib/posts';
import { absoluteUrl } from '@/lib/site';

/** 构建期生成 sitemap.xml（配合 output: 'export' 会直接产出静态文件） */
export const dynamic = 'force-static';

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/posts', priority: 0.9, changeFrequency: 'daily' },
  { path: '/categories', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/guestbook', priority: 0.4, changeFrequency: 'weekly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const categories = getCategoriesWithCount();
  const latestDate = posts[0]?.date ? new Date(posts[0].date) : new Date();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: latestDate,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...categories
      .filter((category) => category.count > 0)
      .map((category) => ({
        url: absoluteUrl(`/categories/${category.slug}`),
        lastModified: latestDate,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
  ];
}
