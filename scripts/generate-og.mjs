/**
 * 生成社交分享图 public/og.png（1200×630，Open Graph / Twitter Card 标准尺寸）
 *
 * 为什么用脚本生成而不是手放一张图：
 * 换站点名、标语或域名后，只要重跑 `npm run og` 就能得到新的分享图，
 * 不用重新设计，也不会出现图片文字和站点信息不一致的情况。
 *
 * 依赖 sharp（Next.js 自带，无需额外安装）。
 */
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(path.join(projectRoot, 'config', 'site.json'), 'utf8'));

/** 转义 XML 特殊字符，避免站点名里出现 & < > 时 SVG 解析失败 */
const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const displayHost = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const W = 1200;
const H = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="6" height="${H}" fill="#111111"/>

  <text x="88" y="132" font-family="Inter, Segoe UI, sans-serif" font-size="24"
        letter-spacing="8" fill="#9a9a9a">${esc(site.nameEn)}</text>

  <text x="88" y="300" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="84"
        font-weight="700" fill="#111111">${esc(site.title)}</text>

  <text x="88" y="382" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="34"
        fill="#4a4a4a">${esc(site.description)}</text>

  <text x="88" y="452" font-family="Inter, Segoe UI, sans-serif" font-size="26"
        fill="#8a8a8a">${esc(site.tagline)}</text>

  <line x1="88" y1="516" x2="${W - 88}" y2="516" stroke="#e6e6e6" stroke-width="1"/>
  <text x="88" y="560" font-family="Inter, Segoe UI, sans-serif" font-size="24"
        fill="#9a9a9a">${esc(displayHost)}</text>
</svg>`;

const outDir = path.join(projectRoot, 'public');
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, 'og.png');

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outFile);

const info = await sharp(outFile).metadata();
console.log(`已生成 public/og.png (${info.width}x${info.height})`);
