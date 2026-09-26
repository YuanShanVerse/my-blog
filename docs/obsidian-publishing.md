# Obsidian → 个人博客

## 日常写作

在 Vault 的 `08 博客/草稿/` 写文章。准备发布时，把笔记移动到 `08 博客/待发布/`，确认 Frontmatter 中 `draft: false`。脚本会保留待发布文件，便于发布后自行归档。

推荐 Frontmatter：

```yaml
---
title: "文章标题"
slug: article-slug
date: 2026-09-26
description: "一句话摘要"
category: 随笔
tags:
  - 写作
draft: false
---
```

`title` 缺省时使用文件名；`slug` 缺省时从英文标题生成，中文标题会生成包含日期的稳定短 slug。建议为中文标题填写简短英文 `slug`。`date` 缺省时使用发布当天，`description` 缺省时从正文提取前 120 个字符。`category` 可以填写 `config/categories.json` 中的分类名称或 slug；缺省时优先匹配分类标签，再使用“随笔”。

## 导入

```bash
npm run publish:post -- "文章文件名.md"
```

若待发布目录恰好只有一篇 Markdown，也可以直接运行 `npm run publish:post`。有多篇时必须指定文件名。脚本只接受待发布目录中的 `.md` 文件，遇到 `draft: true`、重名 slug、无法解析的日期、缺失或重名图片时会停止，不会覆盖文章。

| Obsidian 写法 | 博客处理 |
| --- | --- |
| `[[笔记]]` | 转为可读文字“笔记” |
| `[[路径/笔记\|显示文字]]` | 转为“显示文字” |
| `![[图片.png]]` | 复制到 `public/images/obsidian/<slug>/` 并改写成网站图片路径 |
| `![[图片.png\|替代文字]]` | 同上，并使用指定替代文字 |

图片可以放在笔记旁边、Vault 根目录或 `99 附件/`。仅博客副本中的语法会被转换；原笔记和原附件不会修改。标准 Markdown、标题、表格、引用和代码块会原样保留。

## 发布检查与上线

导入后检查 `content/posts/<slug>.md`、图片路径、Frontmatter 和文章预览，再运行：

```bash
npm run typecheck
npm run build
npm run verify
```

都通过后，按用户当前要求提交本次文章与图片，并推送现有发布分支。GitHub 推送继续触发现有 Vercel 自动部署，无需增加第二套部署流程。失败时不要推送；先修复本次导入造成的问题。

## 本机配置

`config/obsidian.local.json` 保存本机 Vault 路径，已加入 `.gitignore`，不会进入公开仓库。换电脑或 Vault 位置变化时，更新其中的 `vaultPath`；也可以通过 `OBSIDIAN_VAULT` 环境变量覆盖。
