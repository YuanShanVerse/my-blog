import raw from '@/config/categories.json';

/** 分类定义（唯一数据源：config/categories.json） */
export interface Category {
  slug: string;
  name: string;
  description: string;
}

const categoryList: Category[] = (raw.categories as Category[]).map((item) => ({ ...item }));

/** 全部分类（按配置文件顺序） */
export function getAllCategories(): Category[] {
  return categoryList;
}

export function getCategorySlugs(): string[] {
  return categoryList.map((category) => category.slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categoryList.find((category) => category.slug === slug);
}

/**
 * 把 frontmatter 里的 category 解析成标准分类。
 * 允许写 slug（ai）或者中文名（AI / 投资），降低写作时的心智负担。
 */
export function resolveCategory(value: string): Category | undefined {
  const target = value.trim();
  if (!target) return undefined;
  const lower = target.toLowerCase();
  return (
    categoryList.find((category) => category.slug.toLowerCase() === lower) ??
    categoryList.find((category) => category.name.toLowerCase() === lower) ??
    categoryList.find((category) => category.name === target)
  );
}

/** 未知分类时的回退值，保证文章不会因为写错分类而丢失 */
export const FALLBACK_CATEGORY: Category = {
  slug: 'uncategorized',
  name: '未分类',
  description: '尚未归类的文章。',
};
