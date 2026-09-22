#!/usr/bin/env node
/**
 * 本地预览静态产物。
 *
 * `next build` 生成的是纯静态文件（out/），需要一个静态服务器来预览。
 * 这里用 Node 内置模块起一个小服务器，支持 /posts/xxx 这种无扩展名路径，
 * 避免额外安装 serve / http-server 之类的依赖。
 *
 * 用法：npm run build && npm run preview
 * 端口：默认 4321，可用 PORT 环境变量覆盖
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(projectRoot, 'out');
const port = Number(process.env.PORT ?? 4321);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

/** 把 URL 解析成 out/ 下的真实文件：先原样，再补 .html，最后试 index.html */
async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  const relative = clean.replace(/^\/+/, '');
  const candidates = [relative, `${relative}.html`, path.join(relative, 'index.html')];

  for (const candidate of candidates) {
    const filePath = path.resolve(outDir, candidate);
    if (!filePath.startsWith(outDir)) continue; // 防止路径穿越
    try {
      const info = await stat(filePath);
      if (info.isFile()) return filePath;
    } catch {
      /* 继续尝试下一个候选 */
    }
  }
  return null;
}

const server = createServer(async (request, response) => {
  const url = request.url ?? '/';
  const filePath = await resolveFile(url);

  if (!filePath) {
    let body = '404 Not Found';
    try {
      body = await readFile(path.join(outDir, '404.html'), 'utf8');
    } catch {
      /* 没有 404 页面就返回纯文本 */
    }
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    response.end(body);
    return;
  }

  const body = await readFile(filePath);
  const type = MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream';
  response.writeHead(200, {
    'content-type': type,
    'cache-control': 'no-store',
  });
  response.end(body);
});

server.listen(port, () => {
  console.log(`\n  静态预览已启动：http://localhost:${port}`);
  console.log(`  产物目录：${outDir}\n`);
});
