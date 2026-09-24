import { site } from '@/lib/site';

/**
 * Now 区块：一句「最近在做什么」。
 * 内容写在 config/site.json 的 now 字段里，定期手动更新即可。
 * 只是一段字，没有边框和底色 —— 让它在页面上像一句话，而不是一个模块。
 */
export function NowBlock() {
  return (
    <div className="max-w-reading">
      <p className="font-mono text-sm leading-relaxed text-fg">{site.now.text}</p>
      <p className="mt-3 text-xs text-faint">最后更新于 {site.now.updated}</p>
    </div>
  );
}
