# Obsidian 文章发布

- 发布入口是 `08 博客/待发布/`。本机 Vault 路径从被 `.gitignore` 排除的 `config/obsidian.local.json` 读取；不要把这个本机配置提交到 Git。
- 用户明确要求发布某篇或队列中的文章时，先确认目标在待发布目录，再运行 `npm run publish:post -- "文件名.md"`。不指定文件名时，脚本只接受队列中恰好一篇 Markdown。
- 导入会保留 Obsidian 原笔记，在 `content/posts/` 新建发布副本；不会覆盖同 slug 的文章。图片复制到 `public/images/obsidian/<slug>/`。
- 检查文章 Frontmatter、图片和链接转换结果；然后运行 `npm run typecheck`、`npm run build`、`npm run verify`。项目没有配置 lint 脚本。
- 只有用户要求“发布”并且检查通过后，才将本次文章与图片加入 Git、提交 `publish: <文章标题>` 并推送当前发布分支，让 Vercel 使用现有 GitHub 集成部署。未通过检查时不提交、不推送。
- 不改写或移动 Obsidian 原笔记；不碰与本次发布无关的文件。
