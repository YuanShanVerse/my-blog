/**
 * Next.js 配置
 *
 * 采用「完全静态导出」(output: 'export')：
 * - 构建产物在 out/ 目录，是纯静态文件，任何静态托管都能跑（Vercel / Netlify / Cloudflare Pages / GitHub Pages / Nginx）
 * - 没有服务端运行时 → 更少的运维成本 + 更快的首屏
 * - 如果将来需要服务端能力（留言板写库、按需渲染），删掉 output 这一行即可，其它代码不用改
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  // URL 保持 /posts/ai-agent 这种无尾斜杠形式
  trailingSlash: false,
  // 静态导出不支持内置图片优化服务，改用原生 <img> + loading="lazy"
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
