#!/usr/bin/env node
/**
 * 构建产物自检脚本（npm run verify）
 *
 * 把「上线前应该人工检查的事」固化成一条命令：
 *   1. 关键文件是否都生成了
 *   2. 文章数量在 HTML / RSS / Sitemap / 搜索索引之间是否一致
 *   3. 草稿（draft: true）是否泄漏到了任何公开产物里
 *   4. 每篇文章的 SEO 元信息是否齐全
 *   5. 文章页正文是否真的渲染出了目录与内容
 *   6. 每个页面是否有且只有一个 h1
 *   7. 静态文件（RSS / Sitemap）是否误用了 next/link
 *
 * 任何一项失败都会以非 0 退出码结束，方便接到 CI 里。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(projectRoot, 'out');
const postsDir = path.join(projectRoot, 'content', 'posts');

const failures = [];
const passes = [];

function check(label, condition, detail = '') {
  if (condition) passes.push(`${label}${detail ? ` — ${detail}` : ''}`);
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

if (!existsSync(outDir)) {
  console.error('找不到 out/ 目录，请先执行 npm run build');
  process.exit(1);
}

/* ------------------------------ 1. 关键文件 ------------------------------ */

const REQUIRED_FILES = [
  'index.html',
  'posts.html',
  'categories.html',
  'about.html',
  'guestbook.html',
  '404.html',
  'rss.xml',
  'sitemap.xml',
  'robots.txt',
  'search-index.json',
  'icon.svg',
];

const missing = REQUIRED_FILES.filter((file) => !existsSync(path.join(outDir, file)));
check('关键产物文件齐全', missing.length === 0, missing.length ? `缺失：${missing.join(', ')}` : `${REQUIRED_FILES.length} 个文件`);

/* ------------------------------ 2. 统计口径 ------------------------------ */

const postFiles = readdirSync(path.join(outDir, 'posts')).filter((file) => file.endsWith('.html'));
const searchIndex = JSON.parse(readFileSync(path.join(outDir, 'search-index.json'), 'utf8'));
const rssXml = readFileSync(path.join(outDir, 'rss.xml'), 'utf8');
const sitemapXml = readFileSync(path.join(outDir, 'sitemap.xml'), 'utf8');
const robotsTxt = readFileSync(path.join(outDir, 'robots.txt'), 'utf8');

const rssCount = (rssXml.match(/<item>/g) ?? []).length;
const sitemapPostCount = (sitemapXml.match(/<loc>[^<]*\/posts\/[^<]+<\/loc>/g) ?? []).length;

check('文章页数量与搜索索引一致', postFiles.length === searchIndex.posts.length, `pages=${postFiles.length} index=${searchIndex.posts.length}`);
check('文章页数量与 RSS 一致', postFiles.length === rssCount, `pages=${postFiles.length} rss=${rssCount}`);
check('文章页数量与 Sitemap 一致', postFiles.length === sitemapPostCount, `pages=${postFiles.length} sitemap=${sitemapPostCount}`);
check('Sitemap 含静态页与分类页', sitemapPostCount > 0 && sitemapXml.includes('/categories/'), '');
check('robots.txt 指向 sitemap', robotsTxt.includes('Sitemap:'), '');

/* --------------------------- 3. 草稿不应泄漏 --------------------------- */

const draftSlugs = readdirSync(postsDir)
  .filter((file) => file.endsWith('.md'))
  .filter((file) => /^---[\s\S]*?\ndraft:\s*true\s*$/m.test(readFileSync(path.join(postsDir, file), 'utf8').split('---')[1] ?? ''))
  .map((file) => file.replace(/\.md$/, ''));

const leaked = draftSlugs.filter((slug) => {
  const published = searchIndex.posts.some((post) => post.slug === slug);
  const inRss = rssXml.includes(`/posts/${slug}`);
  const inSitemap = sitemapXml.includes(`/posts/${slug}`);
  const hasPage = existsSync(path.join(outDir, 'posts', `${slug}.html`));
  return published || inRss || inSitemap || hasPage;
});

check(
  '草稿未泄漏到公开产物',
  leaked.length === 0,
  draftSlugs.length ? `草稿 ${draftSlugs.length} 篇：${leaked.length ? `泄漏 ${leaked.join(', ')}` : '全部已隔离'}` : '无草稿',
);

/* ------------------------------- 4. SEO ------------------------------- */

const seoProblems = [];
for (const post of searchIndex.posts) {
  const html = readFileSync(path.join(outDir, 'posts', `${post.slug}.html`), 'utf8');
  const issues = [];
  if (!/<title>[^<]+<\/title>/.test(html)) issues.push('title');
  if (!html.includes('property="og:title"')) issues.push('og:title');
  if (!html.includes('property="og:description"')) issues.push('og:description');
  if (!html.includes('name="twitter:card"')) issues.push('twitter:card');
  if (!html.includes('rel="canonical"')) issues.push('canonical');
  if (!html.includes('"@type":"BlogPosting"')) issues.push('BlogPosting JSON-LD');

  const headingCount = (html.match(/<h2[^>]*>/g) ?? []).length;
  if (headingCount < 1) issues.push('正文没有 h2');

  const tocLinks = (html.match(/href="#[^"]+"/g) ?? []).length;
  if (tocLinks < 1) issues.push('目录锚点缺失');

  if (issues.length > 0) seoProblems.push(`${post.slug}: ${issues.join(', ')}`);
}

check(
  '每篇文章的 SEO 元信息与目录齐全',
  seoProblems.length === 0,
  seoProblems.length ? seoProblems.join(' | ') : `${searchIndex.posts.length} 篇全部通过`,
);

/* ---------------------------- 5. 首页与主题 ---------------------------- */

const homeHtml = readFileSync(path.join(outDir, 'index.html'), 'utf8');
check('首页注入主题脚本（防深色闪屏）', homeHtml.includes("localStorage.getItem('theme')"), '');
check('首页存在 RSS 订阅入口', homeHtml.includes('/rss.xml'), '');
check('首页渲染出文章列表', homeHtml.includes('/posts/'), '');

/* ------------------------------ 6. 标题层级 ------------------------------ */

/*
 * 每个页面必须有且只有一个 h1。
 * 首屏与关于页的视觉标题是 SVG 字标，最容易在改版时把一级标题漏掉，
 * 所以这里对所有产出页面做一次兜底检查。
 */
const pageHtmlFiles = readdirSync(outDir, { recursive: true })
  .map((entry) => String(entry))
  .filter((entry) => entry.endsWith('.html'));

const h1Problems = pageHtmlFiles
  .map((file) => {
    const html = readFileSync(path.join(outDir, file), 'utf8');
    const count = (html.match(/<h1[\s>]/g) ?? []).length;
    return count === 1 ? null : `${file} 有 ${count} 个`;
  })
  .filter(Boolean);

check(
  '每个页面有且只有一个 h1',
  h1Problems.length === 0,
  h1Problems.length ? h1Problems.join(', ') : `${pageHtmlFiles.length} 个页面全部通过`,
);

/* ---------------------------- 7. 源码层链接写法 ---------------------------- */

/*
 * rss.xml / sitemap.xml / og.png 这类构建期产出的静态文件必须用原生 <a>。
 * 用 next/link 会触发 RSC 预取（/rss.xml.txt），在静态托管下必然 404，
 * 而产物 HTML 与原生 <a> 长得一样，没法在产物里查，只能查源码。
 */
const sourceDirs = ['app', 'components'];
const sourceFiles = [];
const collectSources = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSources(full);
    else if (/\.tsx?$/.test(entry.name)) sourceFiles.push(full);
  }
};
for (const dir of sourceDirs) collectSources(path.join(projectRoot, dir));

const badLinkPattern = /<Link[^>]*href="\/[^"]*\.(?:xml|json|txt|png|svg|ico)"/;
const badLinks = sourceFiles
  .filter((file) => badLinkPattern.test(readFileSync(file, 'utf8')))
  .map((file) => path.relative(projectRoot, file));

check(
  '静态文件链接使用原生 <a> 而非 next/link',
  badLinks.length === 0,
  badLinks.length ? badLinks.join(', ') : `${sourceFiles.length} 个源文件全部通过`,
);

/* ------------------------------- 输出结果 ------------------------------- */

const totalBytes = readdirSync(path.join(outDir), { recursive: true })
  .map((entry) => {
    const filePath = path.join(outDir, entry);
    try {
      return statSync(filePath).isFile() ? statSync(filePath).size : 0;
    } catch {
      return 0;
    }
  })
  .reduce((sum, size) => sum + size, 0);

console.log('\n通过：');
for (const line of passes) console.log(`  ✓ ${line}`);

if (failures.length > 0) {
  console.log('\n失败：');
  for (const line of failures) console.log(`  ✗ ${line}`);
}

console.log(`\n产物总大小：${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`结果：${passes.length} 项通过，${failures.length} 项失败\n`);

process.exit(failures.length > 0 ? 1 : 0);
