# 留白 · 个人博客

一个以内容为中心的极简个人博客 / 数字花园。写作流程是 **写 Markdown → git push → 自动部署**，没有后台、没有数据库、没有第三方脚本。

- 站点名、作者、简介、社交链接：全在 `config/site.json`
- 分类：全在 `config/categories.json`
- 文章：`content/posts/*.md`

---

## 1. 技术栈

| 层 | 选择 | 为什么 |
| --- | --- | --- |
| 框架 | **Next.js 15（App Router）+ TypeScript strict** | 静态生成成熟、SEO 元数据 API 完整、长期维护活跃 |
| 渲染 | **完全静态导出**（`output: 'export'`） | 产物是纯静态文件，可放 Vercel / Netlify / Cloudflare Pages / 任意 Nginx，没有服务端运维成本 |
| 样式 | **Tailwind CSS + CSS 变量** | 颜色全部走语义变量（`--bg` / `--fg` / `--accent`），深浅色只换一套变量，组件里没有任何 `dark:` 前缀 |
| 内容 | **Markdown + gray-matter + unified/remark/rehype** | 不需要 MDX 也能覆盖代码高亮、表格、数学公式、脚注；构建期渲染成 HTML，浏览器端零解析成本 |
| 代码高亮 | **Shiki**（双主题变量） | 构建期高亮，运行时通过 CSS 变量切换深浅色，切换主题不重新高亮 |
| 数学公式 | **remark-math + rehype-katex** | 本地打包 KaTeX 样式，不依赖 CDN |
| 搜索 | 构建期生成静态索引 `/search-index.json` | 首次打开搜索面板才拉取，不增加任何页面的首屏负担 |
| 留言板 | 浏览器 localStorage + 可替换的 Store 接口 | 第一版零后端；接 Supabase 时只换一个实现类 |

**首屏 JS 约 103 kB（gzip 后更小），没有引入任何 UI 库、图标库、状态管理库。**

---

## 2. 目录结构

```text
personal-blog/
├─ app/                        # 路由（App Router）
│  ├─ layout.tsx               # 全局布局：字体、主题脚本、导航、页脚、搜索面板
│  ├─ page.tsx                 # 首页
│  ├─ posts/
│  │  ├─ page.tsx              # 文章列表（搜索 / 分类筛选 / 排序 / 分页）
│  │  └─ [slug]/page.tsx       # 文章详情（正文 + 目录 + 上下篇 + 分享 + JSON-LD）
│  ├─ categories/
│  │  ├─ page.tsx              # 分类总览
│  │  └─ [slug]/page.tsx       # 分类详情
│  ├─ about/page.tsx           # 关于
│  ├─ guestbook/page.tsx       # 留言板
│  ├─ not-found.tsx            # 404
│  ├─ sitemap.ts               # → /sitemap.xml
│  ├─ robots.ts                # → /robots.txt
│  ├─ rss.xml/route.ts         # → /rss.xml（全文输出）
│  ├─ search-index.json/route.ts  # → /search-index.json
│  └─ icon.svg                 # favicon
├─ components/                 # UI 组件（按职责拆分，均为服务端组件，仅必要处标注 'use client'）
├─ config/
│  ├─ site.json                # 站点信息（唯一数据源）
│  └─ categories.json          # 分类定义
├─ content/posts/              # 文章 Markdown
├─ lib/
│  ├─ posts.ts                 # 内容层：读取 / 排序 / 归档 / 相邻文章
│  ├─ markdown.ts              # Markdown → HTML 渲染管线（Shiki / KaTeX / 锚点 / 表格）
│  ├─ categories.ts            # 分类解析
│  ├─ search.ts                # 搜索索引构建
│  ├─ guestbook.ts             # 留言板数据层 + 校验 + 防刷
│  ├─ site.ts / utils.ts / events.ts
├─ scripts/
│  ├─ preview.mjs              # 预览构建产物（无需额外依赖的静态服务器）
│  ├─ new-post.mjs             # 新建文章脚手架
│  └─ verify-build.mjs         # 上线前自检
├─ styles/
│  ├─ globals.css              # 设计变量 + 基础层 + 通用组件类
│  └─ prose.css                # 文章正文排版（中文长文专门调过）
└─ public/images/              # 图片资源
```

---

## 3. 如何本地运行

```bash
cd personal-blog
npm install

npm run dev          # 开发模式：http://localhost:3000
```

构建并预览生产产物（推荐在发布前跑一遍）：

```bash
npm run typecheck    # TypeScript strict 检查，应输出 0 错误
npm run build        # 静态导出到 out/
npm run verify       # 自检：产物完整性 / 数量一致性 / 草稿泄漏 / SEO 元信息
npm run preview      # 用本地静态服务器预览 out/，默认 4321 端口
```

---

## 4. 如何添加新文章

### 方式一：脚手架（推荐）

```bash
npm run new -- my-post-slug --title "文章标题" --category ai --tags "AI,工具"
```

会在 `content/posts/my-post-slug.md` 生成带 frontmatter 的模板，默认 `draft: true`（不会被发布）。写完把 `draft` 改成 `false`，重新构建即可。

> slug 必须用英文（它同时是文件名和 URL），例如 `my-post-slug`。

### 方式二：直接新建文件

在 `content/posts/` 下新建 `任意-slug.md`：

```yaml
---
title: "AI Agent 到底是什么？"
description: "一句话摘要，会用于列表页、搜索与 SEO"
date: "2026-09-21"
updated: "2026-09-24"        # 可选，会显示「更新于」
category: "AI"               # 可写分类名（AI）或 slug（ai）
tags: [AI, Agent, LLM]
author: "你的名字"            # 可选，不写则用 config/site.json 里的作者名
cover: "/images/cover.webp"  # 可选，填了会作为 OG 图
draft: false
featured: true               # 可选，首页「精选」区会展示（最多 3 篇）
---

正文用 Markdown 写。支持标题、粗体、斜体、引用、有序/无序列表、任务列表、
表格、脚注、图片、链接、代码块（```ts）、数学公式（$...$ 与 $$...$$）。
```

文件名即 URL：`content/posts/ai-agent.md` → `/posts/ai-agent`。

**草稿机制**：`draft: true` 的文章不会出现在首页、列表、分类、搜索索引、RSS、Sitemap 中，也不会生成页面。

---

## 5. 如何修改个人信息

全部集中在 **`config/site.json`**：

| 字段 | 作用 |
| --- | --- |
| `name` / `nameEn` | 站点名（导航左上角、页脚、SEO 标题模板） |
| `title` | 浏览器标题（首页） |
| `tagline` / `description` | 首页那一句英文标语 + 中文简介（也用作全站 description） |
| `url` | **站点正式域名，必须改成你自己的**（影响 canonical / OG / sitemap / RSS 里的绝对地址） |
| `author.*` | 姓名、bio、Email、GitHub、Twitter、所在地 |
| `intro.lead` / `intro.body` | 首页与关于页的自我介绍段落 |
| `now.text` / `now.updated` | 首页 Now 区块文案与更新时间 |
| `featuredLimit` / `postsPerPage` / `latestOnHome` | 精选数量 / 每页篇数 / 首页展示篇数 |

> 改完 `url` 后需要重新构建，sitemap / RSS / canonical 才会更新。

---

## 6. 如何修改分类

编辑 **`config/categories.json`**：

```json
{
  "slug": "ai",
  "name": "AI",
  "description": "分类页顶部会展示这句话"
}
```

- `slug` 决定 URL：`/categories/ai`
- 文章的 frontmatter `category` 可以写 `"AI"`（name）或 `"ai"`（slug），两者都能识别
- **删掉一个分类**：先确认没有文章在用它，否则这些文章会落入「未分类」
- **改名**（只改 `name`）不会影响已有 URL，因为 URL 用的是 `slug`

---

## 7. 如何部署到 Vercel

### 方式一：Git 集成（推荐，真正的「写 Markdown → push → 自动部署」）

1. 把项目推到 GitHub
2. 打开 [vercel.com/new](https://vercel.com/new)，导入这个仓库
3. Framework Preset 会自动识别为 Next.js，无需改动任何构建配置
4. 点 Deploy

之后每次 `git push` 都会自动重新构建发布。

### 方式二：命令行

```bash
npm i -g vercel
vercel          # 预览环境
vercel --prod   # 生产环境
```

> 本项目使用 `output: 'export'`，产物是纯静态文件（`out/`）。如果你想换成 Vercel 的服务端渲染（例如以后要加留言板 API），**只需删掉 `next.config.mjs` 里的 `output: 'export'` 一行**，其余代码不用动。

### 其他平台

- **Cloudflare Pages**：Build command `npm run build`，Output directory `out`
- **Netlify**：同上
- **GitHub Pages / 任意 Nginx**：把 `out/` 整个目录上传即可

---

## 8. 如何绑定自己的域名

1. **在 Vercel**：Project → Settings → Domains → 添加你的域名
2. **在域名商处配置 DNS**（以 `example.com` 为例）：
   - 根域名：添加 `A` 记录指向 `76.76.21.21`
   - `www` 子域名：添加 `CNAME` 记录指向 `cname.vercel-dns.com`
   - （具体值以 Vercel 页面提示为准）
3. 等待 DNS 生效（通常几分钟到几小时），Vercel 会自动签发 HTTPS 证书
4. **把 `config/site.json` 里的 `url` 改成你的正式域名**（如 `https://example.com`），然后重新部署 —— 这一步不能忘，否则 canonical、sitemap、RSS 里还是旧域名

绑定完成后建议提交一次站点地图给搜索引擎：Google Search Console / Bing Webmaster 添加 `https://你的域名/sitemap.xml`。

---

## 9. 后续如何接入数据库（留言板）

留言板的 UI 与存储是解耦的，升级只需要换一个 Store 实现。

**第一步：建表**（以 Supabase 为例）

```sql
create table guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 24),
  message text not null check (char_length(message) between 2 and 400),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved'))
);

alter table guestbook enable row level security;

-- 任何人只能读已通过的留言
create policy "public read approved"
  on guestbook for select using (status = 'approved');
-- 写入只允许通过 Edge Function（服务端校验后插入），前端不开放 insert
```

**第二步：实现 Store**（`lib/guestbook.ts` 里已经留好了骨架）

```ts
export class SupabaseGuestbookStore implements GuestbookStore {
  constructor(private client: SupabaseClient) {}

  async list() {
    const { data } = await this.client
      .from('guestbook')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    return (data ?? []).map(toEntry);
  }

  async create(entry: NewGuestbookEntry) {
    const { data, error } = await this.client.functions.invoke('guestbook-create', {
      body: entry,           // 服务端函数里再做一次长度 / 频率 / 垃圾内容校验
    });
    if (error) throw error;
    return toEntry(data);
  }
}
```

**第三步：切换**——设置环境变量即可，组件代码一行都不用改：

```bash
NEXT_PUBLIC_GUESTBOOK_ENDPOINT=https://<project>.supabase.co/functions/v1/guestbook
```

注意两点：

- 前端校验（长度、XSS 过滤、蜜罐、算术验证码、30 秒限流）只是体验优化，**同样的规则必须在服务端再跑一遍**
- 生产环境建议把算术验证码换成 Cloudflare Turnstile 或 hCaptcha，这类服务有免费额度

---

## 10. 后续如何接入 AI Agent 自动整理文章

这个项目的数据结构天然适合被 Agent 处理：文章是纯文本 Markdown，元信息是结构化 YAML。建议按「从低风险到高风险」逐步接入：

**① 生成摘要与打标签（最安全，推荐先做）**

写一个脚本，遍历 `content/posts/*.md`，把正文交给模型，让它返回 `description` 和 `tags`：

```ts
// scripts/ai-enrich.mjs（示意）
for (const file of listPosts()) {
  const { data, content } = matter(readFileSync(file, 'utf8'));
  if (data.description && data.tags?.length) continue;   // 已有元信息就跳过
  const result = await callModel({
    system: '你是博客编辑。只输出 JSON：{"description": "...", "tags": ["..."]}',
    user: content.slice(0, 6000),
  });
  writeFileSync(file, matter.stringify(content, { ...data, ...JSON.parse(result) }), 'utf8');
}
```

配合 `npm run verify` 自检，再提交 PR / 自动 commit 都可以。**关键是保留人工确认环节**，不要让模型直接改动已发布内容。

**② 质量检查（只读，不改文件）**

```
读一篇草稿，指出：论证最弱的三个地方 / 重复的表达 / 术语前后不一致的地方。
不要改写，只报告。
```

**③ 知识库维护（跨文件）**

```
扫描 content/posts/ 全部文章，找出：
1. 主题相近但没有互相链接的文章，建议在哪两段之间加内部链接
2. 反复出现但没有单独成篇的概念，建议作为新文章候选
3. 相互矛盾的结论（同一个人在不同时间的不同判断）
```

**④ 半自动写作（最后再做）**

让 Agent 负责：整理你的口述笔记 → 生成大纲 → 生成初稿；**你负责**：判断、取舍、定稿。

给 Agent 的上下文建议只放三类东西：文章 frontmatter 列表（让它知道已有什么）、相关的旧文章全文（避免重复）、`config/site.json`（知道作者的立场与语气）。不要一次性把整个 `content/` 塞进上下文。

---

## 设计原则（Content First）

需求冲突时的优先级：

> **阅读体验 > 内容管理 > 性能 > SEO > 视觉 > 复杂功能**

具体体现：

- 正文最大宽度 45rem（约 720px），中文 17px / 行高 1.85，段间距 1.35em
- 全站只有一处动画性质的效果：顶部 2px 阅读进度条
- 没有任何 UI 框架、动画库、图标库；图标是手写的内联 SVG
- 中文不加载 WebFont（只加载拉丁字形的 Inter），避免几 MB 的中文字库
- 首页不做 Banner、不做三列功能卡、不做「立即开始」

## 可访问性与细节

- 语义化标签（`header` / `nav` / `main` / `article` / `time`）、跳转到主内容的 skip link
- 键盘可达：搜索面板支持 `Ctrl/⌘ + K`、`↑ ↓` 选择、`Enter` 打开、`Esc` 关闭
- `prefers-reduced-motion` 下关闭动画与平滑滚动
- 深色模式遵循 `localStorage → 系统偏好`，并用内联脚本避免首屏闪白
- 图片 `loading="lazy"` + `decoding="async"`，SVG 资源无外部依赖
