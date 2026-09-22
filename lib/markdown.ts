import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { createHighlighter, type Highlighter } from 'shiki';
import { unified, type Plugin } from 'unified';

/**
 * Markdown → HTML 渲染管线（只在构建期运行）。
 *
 * remark 解析 Markdown，rehype 插件负责：标题锚点、代码高亮、外链属性、图片懒加载、表格包裹，
 * 最后输出静态 HTML 字符串 —— 浏览器端零解析成本，也没有任何 Markdown 相关的 JS。
 */

/* ---------------------------------- 类型 ---------------------------------- */

interface HastElement {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
}
interface HastLike {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  data?: Record<string, unknown>;
  meta?: string;
}
/** text / raw / 自定义节点都用这个宽松结构描述，避免联合类型收窄时的类型报错 */
type HastNode = HastElement | HastLike;

/** 目录条目 */
export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
}

/* -------------------------------- Shiki 高亮 -------------------------------- */

const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const;

const SHIKI_LANGS = [
  'bash',
  'css',
  'diff',
  'go',
  'html',
  'java',
  'js',
  'json',
  'jsx',
  'markdown',
  'python',
  'rust',
  'shell',
  'sql',
  'toml',
  'ts',
  'tsx',
  'yaml',
] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

/** 复用同一个 highlighter 实例，避免每篇文章重复初始化 */
function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
    langs: [...SHIKI_LANGS],
  });
  return highlighterPromise;
}

const LANG_ALIASES: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  sh: 'bash',
  zsh: 'bash',
  console: 'bash',
  yml: 'yaml',
  md: 'markdown',
};

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 高亮代码块。
 * defaultColor: false 让 Shiki 只输出 --shiki-light / --shiki-dark 变量，
 * 由 styles/prose.css 决定当前用哪一套，切换深色模式无需重新高亮。
 */
function highlightCode(highlighter: Highlighter, code: string, lang: string, title?: string): string {
  const normalized = LANG_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase();
  const supported = highlighter.getLoadedLanguages().includes(normalized);
  const body = highlighter.codeToHtml(code.replace(/\n$/, ''), {
    lang: supported ? normalized : 'text',
    themes: SHIKI_THEMES,
    defaultColor: false,
  });

  const label = escapeAttribute(supported ? normalized : 'text');
  const titleAttr = title ? ` data-title="${escapeAttribute(title)}"` : '';
  return `<figure class="code-block" data-lang="${label}"${titleAttr}>${body}</figure>`;
}

/* ------------------------------- hast 小工具 ------------------------------- */

function isElement(node: HastNode, tagName?: string): node is HastElement {
  return node.type === 'element' && (!tagName || (node as HastElement).tagName === tagName);
}

function childrenOf(node: HastNode): HastNode[] {
  return Array.isArray(node.children) ? node.children : [];
}

function textOf(node: HastNode): string {
  if (node.type === 'text' || node.type === 'raw') return node.value ?? '';
  return childrenOf(node).map(textOf).join('');
}

function classNamesOf(node: HastNode): string[] {
  const value = node.properties?.['className'];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(/\s+/);
  return [];
}

/* ------------------------------ 自定义插件 ------------------------------ */

/**
 * 把 ```ts title="lib/a.ts" 里的 meta 搬到 hast 属性上，
 * 让后续 rehype 插件能读到代码块标题。
 */
const remarkCodeMeta: Plugin = () => (tree: unknown) => {
  const visit = (node: HastLike) => {
    if (node.type === 'code' && typeof node.meta === 'string' && node.meta) {
      const data = (node.data ??= {});
      const hProperties = (data['hProperties'] as Record<string, unknown> | undefined) ?? {};
      hProperties['data-meta'] = node.meta;
      data['hProperties'] = hProperties;
    }
    for (const child of childrenOf(node)) visit(child as HastLike);
  };
  visit(tree as HastLike);
};

interface EnhanceOptions {
  /** 站点域名，用于判断是否为外链 */
  siteHost: string;
}

/**
 * 内容增强插件：
 * 1. 代码块 → Shiki 高亮（含语言标签与复制按钮容器）
 * 2. 外链 → 新窗口打开 + rel="noopener noreferrer"
 * 3. 图片 → 懒加载 / 异步解码 / 点击放大标记
 * 4. 表格 → 外包一层可横向滚动容器，避免移动端撑破布局
 */
const rehypeEnhance: Plugin<[EnhanceOptions]> = (options) => async (tree: unknown) => {
  const highlighter = await getHighlighter();
  const { siteHost } = options;

  const visit = async (node: HastNode): Promise<void> => {
    if (isElement(node, 'pre')) {
      const element = node;
      const codeElement = childrenOf(element).find((child) => isElement(child, 'code'));
      if (codeElement && isElement(codeElement)) {
        const lang =
          classNamesOf(codeElement)
            .find((name) => name.startsWith('language-'))
            ?.slice('language-'.length) ?? 'text';
        const meta = String(
          codeElement.properties?.['data-meta'] ?? element.properties?.['data-meta'] ?? '',
        );
        const title = /title=(?:"([^"]*)"|'([^']*)')/.exec(meta)?.[1];
        Object.assign(element, {
          type: 'raw',
          value: highlightCode(highlighter, textOf(codeElement), lang, title),
        });
        delete (element as Partial<HastElement>).children;
        return;
      }
    }

    if (isElement(node as HastNode, 'a')) {
      const element = node as HastElement;
      const href = String(element.properties?.['href'] ?? '');
      if (/^https?:\/\//i.test(href) && !href.includes(siteHost)) {
        element.properties = {
          ...element.properties,
          target: '_blank',
          rel: 'noopener noreferrer',
          'data-external': 'true',
        };
      }
    }

    if (isElement(node as HastNode, 'img')) {
      const element = node as HastElement;
      element.properties = {
        ...element.properties,
        loading: 'lazy',
        decoding: 'async',
        'data-zoomable': 'true',
      };
    }

    if (isElement(node as HastNode, 'table')) {
      const element = node as HastElement;
      const inner = childrenOf(element);
      element.tagName = 'div';
      element.properties = { className: ['table-wrap'] };
      element.children = [{ type: 'element', tagName: 'table', properties: {}, children: inner }];
      return;
    }

    for (const child of childrenOf(node)) {
      await visit(child);
    }
  };

  await visit(tree as HastLike);
};

/* -------------------------------- 目录提取 -------------------------------- */

const HEADING_RE = /<h([23])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** 从渲染后的 HTML 抽取 h2 / h3 组成目录，锚点 id 与正文天然一致 */
export function extractToc(html: string): TocItem[] {
  const toc: TocItem[] = [];
  for (const match of html.matchAll(HEADING_RE)) {
    const depth = Number(match[1]);
    const id = match[2]!;
    const text = decodeEntities(match[3]!.replace(/<[^>]+>/g, '')).trim();
    if (text) toc.push({ id, text, depth });
  }
  return toc;
}

/* --------------------------------- 入口 --------------------------------- */

/**
 * 渲染一篇 Markdown，返回 HTML 与目录。
 * 每次都新建一条管线：只在构建期调用（十几篇文章 × 几十毫秒），换取更好的隔离性。
 */
export async function renderMarkdown(markdown: string, siteHost = ''): Promise<RenderedMarkdown> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkCodeMeta)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeKatex)
    .use(rehypeEnhance, { siteHost })
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['heading-anchor'], ariaHidden: 'true', tabIndex: '-1' },
    })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = await processor.process(markdown);
  const html = String(file);
  return { html, toc: extractToc(html) };
}
