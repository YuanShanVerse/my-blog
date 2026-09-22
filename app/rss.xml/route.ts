import { renderMarkdown } from '@/lib/markdown';
import { getAllPostsWithBody } from '@/lib/posts';
import { absoluteUrl, site } from '@/lib/site';

/**
 * RSS 2.0 feed：/rss.xml
 * 输出全文（content:encoded），方便在 Feedly / Inoreader 里直接读完；
 * 静态导出时会在构建期生成为 out/rss.xml。
 */
export const dynamic = 'force-static';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 统一用当天 00:00 UTC 作为发布时间，保证构建结果稳定可缓存 */
function toRfc822(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toUTCString();
}

export async function GET(): Promise<Response> {
  const posts = getAllPostsWithBody();
  const siteHost = new URL(site.url).host;
  const lastBuildDate = posts[0]?.date ? toRfc822(posts[0].date) : new Date().toUTCString();

  const items = await Promise.all(
    posts.map(async (post) => {
      const url = absoluteUrl(`/posts/${post.slug}`);
      const { html } = await renderMarkdown(post.body, siteHost);
      const categories = [...post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`)];

      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${toRfc822(post.date)}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        `      <author>${escapeXml(post.author || site.author.name)}</author>`,
        `      <category>${escapeXml(post.categoryName)}</category>`,
        ...categories.map((line) => `      ${line}`),
        `      <content:encoded><![CDATA[${html}]]></content:encoded>`,
        '    </item>',
      ].join('\n');
    }),
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(site.rss.title)}</title>`,
    `    <link>${site.url}</link>`,
    `    <description>${escapeXml(site.rss.description)}</description>`,
    `    <language>${site.rss.language}</language>`,
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml" />`,
    `    <generator>Next.js</generator>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
