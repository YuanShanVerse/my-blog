/**
 * 生成社交分享图 public/og.png（1200×630，Open Graph / Twitter Card 标准尺寸）
 *
 * 为什么用脚本生成而不是手放一张图：
 * 换站点名、标语或域名后，只要重跑 `npm run og` 就能得到新的分享图，
 * 不用重新设计，也不会出现图片文字和站点信息不一致的情况。
 *
 * 「远山」字标使用 config/brand.json 里的矢量路径；山形使用网站同款图片。
 * 其余文字用系统中文字体栈渲染（分享图是位图，不需要与网页字体完全一致）。
 *
 * 依赖 sharp（Next.js 自带，无需额外安装）。
 */
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(path.join(projectRoot, 'config', 'site.json'), 'utf8'));
const brand = JSON.parse(await readFile(path.join(projectRoot, 'config', 'brand.json'), 'utf8'));

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
function fitFontSize(text, maxWidth, preferred, min = 20) {
  let size = preferred;
  while (size > min && estimateWidth(text, size) > maxWidth) size -= 2;
  return size;
}

const W = 1200;
const H = 630;
const PAD = 96;
const CONTENT_WIDTH = W - PAD * 2;
const INK = '#1c1b19';
const FAINT = '#a09a90';
const MUTED = '#4f4b45';
const RULE = '#e6e2d9';

/* 「远山」字标：放在页面左侧；山形标放大到右侧，两者共同撑住整张卡片 */
const MARK_WIDTH = 412;
const markScale = MARK_WIDTH / Number(brand.wordmark.viewBox.split(' ')[2]);
const markTop = 168;
const markHeight = Number(brand.wordmark.viewBox.split(' ')[3]) * markScale;

const mountainWidth = 320;
const mountain = await sharp(path.join(projectRoot, 'public', 'images', 'mountain-ink.webp'))
  .resize({ width: mountainWidth })
  .png()
  .toBuffer();
const mountainHeight = (await sharp(mountain).metadata()).height;
const mountainX = W - PAD - mountainWidth;
const mountainY = Math.round(markTop + markHeight / 2 - mountainHeight / 2);

const taglineSize = fitFontSize(site.tagline, CONTENT_WIDTH, 25);

const displayHost = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const byline = site.author?.name ? `by ${site.author.name}` : '';
const sans = 'Inter, Segoe UI, Helvetica, Arial, sans-serif';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fbfaf7"/>

  <g transform="translate(${PAD} ${markTop}) scale(${markScale.toFixed(6)})">
    <path transform="${brand.wordmark.transform}" d="${brand.wordmark.d}" fill="${INK}"/>
  </g>

  <text x="${PAD}" y="${Math.round(markTop + markHeight + 44)}" font-family="${sans}"
        font-size="19" letter-spacing="9.5" fill="${FAINT}">${esc(site.nameEn)}</text>

  <text x="${PAD}" y="${Math.round(markTop + markHeight + 88)}" font-family="${sans}"
        font-size="${taglineSize}" fill="${MUTED}">${esc(site.tagline)}</text>

  <line x1="${PAD}" y1="524" x2="${W - PAD}" y2="524" stroke="${RULE}" stroke-width="1"/>

  <text x="${PAD}" y="570" font-family="${sans}" font-size="20"
        fill="${FAINT}">${esc(displayHost)}</text>
  <text x="${W - PAD}" y="570" text-anchor="end" font-family="${sans}" font-size="20"
        fill="${FAINT}">${esc(byline)}</text>
</svg>`;

const outDir = path.join(projectRoot, 'public');
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, 'og.png');

await sharp(Buffer.from(svg))
  .composite([{ input: mountain, left: mountainX, top: mountainY }])
  .png({ compressionLevel: 9 })
  .toFile(outFile);

const info = await sharp(outFile).metadata();
console.log(`已生成 public/og.png (${info.width}x${info.height})`);
console.log(`  字标宽度 ${MARK_WIDTH}px / 标高 ${Math.round(markHeight)}px / 标语字号 ${taglineSize}`);
