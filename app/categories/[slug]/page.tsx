import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PostExplorer } from '@/components/PostExplorer';
import { getCategoryBySlug, getCategorySlugs } from '@/lib/categories';
import { getPostsByCategory } from '@/lib/posts';
import { site } from '@/lib/site';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: '分类不存在' };

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      type: 'website',
      title: `${category.name} · ${site.name}`,
      description: category.description,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const posts = getPostsByCategory(category.slug);

  return (
    <div className="container-page py-14 sm:py-20">
      <nav className="flex items-center gap-2 text-xs text-faint" aria-label="面包屑">
        <Link href="/categories" className="transition-colors hover:text-fg">
          分类
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-muted">{category.name}</span>
      </nav>

      <header className="mt-6 max-w-reading">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          <span className="text-faint">#</span>
          {category.name}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{category.description}</p>
        <p className="mt-4 text-xs text-faint">共 {posts.length} 篇文章</p>
      </header>

      <PostExplorer
        posts={posts}
        lockedCategory={category.slug}
        perPage={site.postsPerPage}
        className="mt-10"
      />
    </div>
  );
}
