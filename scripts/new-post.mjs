#!/usr/bin/env node
/**
 * 新建文章脚手架。
 *
 * 用法：
 *   npm run new -- my-post-slug --title "文章标题" --category ai --tags "AI,Agent"
 *
 * 说明：
 * - slug 必须是字母/数字/短横线（它同时是文件名和 URL），中文标题请自己起一个英文 slug
 * - category 可以写分类 slug（ai）或中文名（AI），会跟 config/categories.json 校验
 * - 生成后直接编辑 content/posts/<slug>.md 即可，draft: true 时不会被发布
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(projectRoot, 'content', 'posts');

const args = process.argv.slice(2);

/** 解析 --flag value 形式的参数，其余作为位置参数 */
const flags = {};
const positional = [];
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg.startsWith('--')) {
    flags[arg.slice(2)] = args[index + 1];
    index += 1;
  } else {
    positional.push(arg);
  }
}

const slug = positional[0];

if (!slug) {
  console.error('用法：npm run new -- <slug> --title "标题" --category ai --tags "AI,Agent"');
  process.exit(1);
}

if (!/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/.test(slug)) {
  console.error('slug 只能包含字母、数字、短横线和下划线，例如：ai-agent-notes');
  process.exit(1);
}

const categories = JSON.parse(
  readFileSync(path.join(projectRoot, 'config', 'categories.json'), 'utf8'),
).categories;

const categoryInput = flags['category'] ?? categories[0].slug;
const category =
  categories.find((item) => item.slug === categoryInput) ??
  categories.find((item) => item.name === categoryInput);

if (!category) {
  console.error(
    `未找到分类「${categoryInput}」。可选：${categories.map((item) => `${item.slug}(${item.name})`).join('、')}`,
  );
  process.exit(1);
}

const title = flags['title'] ?? slug;
const tags = (flags['tags'] ?? '')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);

const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
  now.getDate(),
).padStart(2, '0')}`;

const filePath = path.join(postsDir, `${slug}.md`);
if (existsSync(filePath)) {
  console.error(`文件已存在：content/posts/${slug}.md`);
  process.exit(1);
}

const frontmatter = [
  '---',
  `title: "${title}"`,
  'description: ""',
  `date: "${today}"`,
  `category: "${category.name}"`,
  tags.length > 0 ? `tags: [${tags.map((tag) => `"${tag}"`).join(', ')}]` : 'tags: []',
  'draft: true',
  '---',
  '',
  '在这里开始写正文。',
  '',
  '## 小标题',
  '',
  '- 第一点',
  '- 第二点',
  '',
].join('\n');

writeFileSync(filePath, frontmatter, 'utf8');
console.log(`已创建：content/posts/${slug}.md`);
console.log(`分类：${category.name}(${category.slug})；写完把 draft 改成 false 重新构建即可发布。`);
