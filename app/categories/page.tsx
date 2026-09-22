import type { Metadata } from 'next';

import { CategoryList } from '@/components/CategoryList';
import { getCategoriesWithCount, getTotalPostCount } from '@/lib/posts';

export const metadata: Metadata = {
  title: '分类',
  description: '按主题浏览全部文章：AI、科技、投资、职业、阅读、旅行、生活与随笔。',
  alternates: { canonical: '/categories' },
};

export default function CategoriesPage() {
  const categories = getCategoriesWithCount();
  const total = getTotalPostCount();
  const used = categories.filter((category) => category.count > 0).length;

  return (
    <div className="container-page py-14 sm:py-20">
      <header className="max-w-reading">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">分类</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          共 {categories.length} 个分类，其中 {used} 个已有文章，全部文章合计 {total} 篇。
        </p>
      </header>

      <CategoryList categories={categories} className="mt-10" />
    </div>
  );
}
