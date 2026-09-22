import { site } from '@/lib/site';

/**
 * Now 区块：一句「最近在做什么」。
 * 内容写在 config/site.json 的 now 字段里，定期手动更新即可。
 */
export function NowBlock() {
  return (
    <div className="rounded-lg border border-line bg-surface px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-2xs uppercase tracking-[0.2em] text-faint">Now</p>
      <p className="mt-2.5 font-mono text-[0.8125rem] leading-relaxed text-fg sm:text-sm">
        {site.now.text}
      </p>
      <p className="mt-3 text-xs text-faint">Last updated: {site.now.updated}</p>
    </div>
  );
}
