/**
 * 生成社交分享图 public/og.png（1200×630，Open Graph / Twitter Card 标准尺寸）
 *
 * 为什么用脚本生成而不是手放一张图：
 * 换站点名、标语或域名后，只要重跑 `npm run og` 就能得到新的分享图，
 * 不用重新设计，也不会出现图片文字和站点信息不一致的情况。
 *
 * 字号不是写死的：按字符宽度估算自动缩放，所以站点名被改成更长的词也不会溢出。
 *
 * 依赖 sharp（Next.js 自带，无需额外安装）。
 */
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(path.join(projectRoot, 'config', 'site.json'), 'utf8'));

/** 转义 XML 特殊字符，避免站点名里出现 & < > 时 SVG 解析失败 */
const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * 粗略估算一段文字在给定字号下的宽度（单位 px）。
 * 只用于自动缩字号，不需要精确 —— 中文字宽约 1em，拉丁字母约 0.5em。
 */
function estimateWidth(text, fontSize) {
  let em = 0;
  for (const char of text) {
    if (/[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/.test(char)) em += 1;
    else if (char === ' ') em += 0.28;
    else if (/[A-Z]/.test(char)) em += 0.64;
    else if (/[a-z0-9]/.test(char)) em += 0.54;
    else em += 0.36;
  }
  return em * fontSize;
}

/** 在不超过 maxWidth 的前提下，返回尽量大的字号（不低于 min） */
function fitFontSize(text, maxWidth, preferred, min = 32) {
  let size = preferred;
  while (size > min && estimateWidth(text, size) > maxWidth) size -= 2;
  return size;
}

const W = 1200;
const H = 630;
const PAD = 88;
const CONTENT_WIDTH = W - PAD * 2;

const titleSize = fitFontSize(site.title, CONTENT_WIDTH, 88, 56);
const taglineSize = fitFontSize(site.tagline, CONTENT_WIDTH, 30, 22);
const descriptionSize = fitFontSize(site.description, CONTENT_WIDTH, 34, 22);

const displayHost = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const byline = site.author?.name ? `by ${site.author.name}` : '';

const sans = 'Inter, Segoe UI, Helvetica, Arial, sans-serif';
const cjk = 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, Noto Sans SC, sans-serif';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="6" height="${H}" fill="#111111"/>

  <text x="${PAD}" y="132" font-family="${sans}" font-size="24"
        letter-spacing="8" fill="#9a9a9a">${esc(site.nameEn)}</text>

  <text x="${PAD}" y="308" font-family="${cjk}" font-size="${titleSize}"
        font-weight="700" fill="#111111">${esc(site.title)}</text>

  <text x="${PAD}" y="390" font-family="${cjk}" font-size="${descriptionSize}"
        fill="#4a4a4a">${esc(site.description)}</text>

  <text x="${PAD}" y="454" font-family="${sans}" font-size="${taglineSize}"
        fill="#8a8a8a">${esc(site.tagline)}</text>

  <line x1="${PAD}" y1="516" x2="${W - PAD}" y2="516" stroke="#e6e6e6" stroke-width="1"/>

  <text x="${PAD}" y="562" font-family="${sans}" font-size="24"
        fill="#9a9a9a">${esc(displayHost)}</text>
  <text x="${W - PAD}" y="562" text-anchor="end" font-family="${sans}" font-size="24"
        fill="#9a9a9a">${esc(byline)}</text>
</svg>`;

const outDir = path.join(projectRoot, 'public');
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, 'og.png');

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outFile);

const info = await sharp(outFile).metadata();
console.log(`已生成 public/og.png (${info.width}x${info.height})`);
console.log(`  标题字号 ${titleSize} / 描述字号 ${descriptionSize} / 标语字号 ${taglineSize}`);
