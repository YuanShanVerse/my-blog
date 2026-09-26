#!/usr/bin/env node
/**
 * 将 Obsidian「博客/待发布」中的一篇 Markdown 导入 content/posts。
 * 原始笔记保留在 Vault 中；图片复制到 public/images/obsidian/<slug>/。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localConfigPath = path.join(projectRoot, 'config', 'obsidian.local.json');
const localConfig = fs.existsSync(localConfigPath)
  ? JSON.parse(fs.readFileSync(localConfigPath, 'utf8'))
  : {};
const vaultRoot = path.resolve(process.env.OBSIDIAN_VAULT ?? localConfig.vaultPath ?? '');
const queueDir = path.join(vaultRoot, '08 博客', '待发布');
const postsDir = path.join(projectRoot, 'content', 'posts');
const imageRoot = path.join(projectRoot, 'public', 'images', 'obsidian');
const categories = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'config', 'categories.json'), 'utf8'),
).categories;
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

function fail(message) {
  console.error(`发布失败：${message}`);
  process.exit(1);
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.obsidian' || entry.name === '.trash') return [];
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(filePath) : [filePath];
  });
}

function findAttachment(target, sourcePath) {
  const normalized = target.replace(/\\/g, '/').replace(/^\//, '');
  const directCandidates = [
    path.resolve(vaultRoot, normalized),
    path.resolve(path.dirname(sourcePath), normalized),
    path.resolve(vaultRoot, '99 附件', normalized),
  ];
  for (const candidate of directCandidates) {
    if (isInside(vaultRoot, candidate) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  const basename = path.basename(normalized);
  const matches = [
    ...walkFiles(path.dirname(sourcePath)),
    ...walkFiles(path.join(vaultRoot, '99 附件')),
  ].filter((file, index, all) => path.basename(file).toLowerCase() === basename.toLowerCase()
    && all.indexOf(file) === index);
  if (matches.length > 1) {
    fail(`图片「${target}」存在多个同名附件，请在 Obsidian 引用中写明附件相对路径。`);
  }
  return matches[0] ?? null;
}

function encodePublicPath(relativePath) {
  return relativePath.split(path.sep).map(encodeURIComponent).join('/');
}

function convertObsidianLine(line, sourcePath, slug, copiedImages) {
  const inlineCode = line.split(/(`+[^`]*`+)/g);
  return inlineCode.map((part) => {
    if (part.startsWith('`')) return part;
    return part.replace(/(!?)\[\[([^\]]+)\]\]/g, (_match, embed, rawTarget) => {
      const [rawPath, rawAlias] = rawTarget.split('|', 2);
      const target = rawPath.split('#', 1)[0].trim();
      const alias = rawAlias?.trim();
      if (!embed) return alias || path.basename(target).replace(/\.md$/i, '');

      const extension = path.extname(target).toLowerCase();
      if (!imageExtensions.has(extension)) return alias || path.basename(target);
      const attachment = findAttachment(target, sourcePath);
      if (!attachment) fail(`找不到图片「${target}」。请检查 Vault 中的附件位置和文件名。`);

      const relativeImage = path.join(slug, path.basename(attachment));
      const destination = path.join(imageRoot, relativeImage);
      const existing = copiedImages.get(relativeImage);
      if (existing && existing !== attachment) {
        fail(`文章中有多个同名图片「${path.basename(attachment)}」，请先在 Obsidian 中重命名其中一个。`);
      }
      copiedImages.set(relativeImage, attachment);
      return `![${(alias || path.basename(attachment)).replace(/[\[\]]/g, '')}](/images/obsidian/${encodePublicPath(relativeImage)})`;
    });
  }).join('');
}

function convertObsidianSyntax(body, sourcePath, slug, copiedImages) {
  let fence = null;
  return body.split(/\r?\n/).map((line) => {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker?.[0] === fence[0] && marker.length >= fence.length) fence = null;
      return line;
    }
    if (marker) {
      fence = marker;
      return line;
    }
    return convertObsidianLine(line, sourcePath, slug, copiedImages);
  }).join('\n');
}

function cleanDescription(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#>*_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return [...text].slice(0, 120).join('');
}

function slugify(title, date) {
  const readable = title.normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (readable) return readable;
  const suffix = crypto.createHash('sha1').update(title).digest('hex').slice(0, 6);
  return `post-${date}-${suffix}`;
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
  }
  const date = String(value ?? '').trim();
  if (!date) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
  if (!match) fail(`日期「${date}」格式不正确，请使用 YYYY-MM-DD。`);
  const normalized = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    fail(`日期「${date}」不是有效日期。`);
  }
  return normalized;
}

function resolveCategory(frontmatter, tags) {
  const requested = String(frontmatter.category ?? '').trim();
  const byValue = (value) => categories.find((item) => item.slug.toLowerCase() === value.toLowerCase()
    || item.name.toLowerCase() === value.toLowerCase());
  const requestedCategory = requested ? byValue(requested) : null;
  if (requested && !requestedCategory) {
    fail(`未找到分类「${requested}」。请检查 config/categories.json。`);
  }
  const category = requestedCategory || tags.map(byValue).find(Boolean) || byValue('essay');
  if (!category) fail('未能匹配文章分类，请检查 config/categories.json。');
  return category.name;
}

if (!vaultRoot || vaultRoot === path.resolve('.')) {
  fail(`未配置 Obsidian Vault 路径。请创建 ${path.relative(projectRoot, localConfigPath)}，或设置 OBSIDIAN_VAULT 环境变量。`);
}
if (!fs.existsSync(queueDir)) fail(`找不到待发布目录：${queueDir}`);

const requested = process.argv[2];
let sourcePath;
if (requested) {
  const requestedPath = path.isAbsolute(requested) ? requested : path.join(queueDir, requested);
  sourcePath = path.resolve(requestedPath);
} else {
  const queued = fs.readdirSync(queueDir)
    .filter((file) => file.toLowerCase().endsWith('.md'))
    .map((file) => path.join(queueDir, file));
  if (queued.length !== 1) {
    fail(queued.length === 0
      ? '待发布目录中没有 Markdown 文章。'
      : `待发布目录中有 ${queued.length} 篇文章，请指定文件名：${queued.map((file) => path.basename(file)).join('、')}`);
  }
  [sourcePath] = queued;
}

if (!isInside(queueDir, sourcePath)) fail('只允许发布「08 博客/待发布」目录中的文章。');
if (path.extname(sourcePath).toLowerCase() !== '.md') fail('只支持 .md 文件。');
if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) fail(`找不到文章：${sourcePath}`);

const raw = fs.readFileSync(sourcePath, 'utf8');
const parsed = matter(raw);
const title = String(parsed.data.title ?? path.basename(sourcePath, '.md')).trim();
if (!title) fail('文章缺少 title，请在 YAML Frontmatter 中填写。');
if (parsed.data.draft === true || String(parsed.data.draft).toLowerCase() === 'true') {
  fail('文章仍标记为 draft: true。确认准备发布后，将其改为 draft: false。');
}

const date = normalizeDate(parsed.data.date);
const slug = String(parsed.data.slug ?? '').trim() || slugify(title, date);
if (!/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/.test(slug)) {
  fail(`slug「${slug}」只允许字母、数字、短横线和下划线。`);
}
const outputPath = path.join(postsDir, `${slug}.md`);
if (fs.existsSync(outputPath)) fail(`文章已存在：content/posts/${slug}.md；为避免覆盖，已中止。`);

const tags = Array.isArray(parsed.data.tags)
  ? parsed.data.tags.map((tag) => String(tag).trim()).filter(Boolean)
  : String(parsed.data.tags ?? '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
const copiedImages = new Map();
const body = convertObsidianSyntax(parsed.content.trim(), sourcePath, slug, copiedImages);
const description = String(parsed.data.description ?? '').trim() || cleanDescription(body);
const metadata = {
  title,
  description,
  date,
  category: resolveCategory(parsed.data, tags),
  tags,
  draft: false,
};
if (parsed.data.updated) metadata.updated = normalizeDate(parsed.data.updated);
if (parsed.data.author) metadata.author = String(parsed.data.author);
if (parsed.data.cover) metadata.cover = String(parsed.data.cover);
if (parsed.data.featured === true) metadata.featured = true;

const output = matter.stringify(body ? `${body}\n` : '', metadata);
for (const [relativePath, attachment] of copiedImages) {
  const destination = path.join(imageRoot, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(attachment, destination);
  console.log(`图片：${path.relative(projectRoot, destination)}`);
}
fs.mkdirSync(postsDir, { recursive: true });
fs.writeFileSync(outputPath, output, 'utf8');
console.log(`已导入：content/posts/${slug}.md`);
console.log(`标题：${title}`);
console.log(`地址：/posts/${slug}`);
console.log('原 Obsidian 笔记已保留；请完成检查、构建和发布后，再决定是否归档队列文件。');
