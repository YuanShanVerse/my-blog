import type { SVGProps } from 'react';

import brand from '@/config/brand.json';

/**
 * 品牌图形资产。
 *
 * 几何数据统一放在 config/brand.json（OG 分享图脚本也读同一份），
 * 这里只负责把它们渲染成可跟随 currentColor 的内联 SVG。
 */

/** 水墨山形标：一条棱角山脊，两端收笔、下缘微微上弧 */
export function MountainMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={brand.ridgeViewBox} fill="currentColor" aria-hidden="true" {...props}>
      <path d={brand.ridge} />
    </svg>
  );
}

/** 「远山」字标 —— 顶栏、首屏与关于页共用同一份轮廓 */
export function Wordmark({
  label = '远山',
  ...props
}: SVGProps<SVGSVGElement> & { label?: string }) {
  return (
    <svg viewBox={brand.wordmark.viewBox} fill="currentColor" role="img" aria-label={label} {...props}>
      <path transform={brand.wordmark.transform} d={brand.wordmark.d} />
    </svg>
  );
}

/**
 * 「山」单字轮廓 —— 页脚那枚朱砂印记用。
 * 印记的方块由外层容器绘制，这里只负责字。
 */
export function SealGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={brand.seal.viewBox} fill="currentColor" aria-hidden="true" {...props}>
      <path transform={brand.seal.transform} d={brand.seal.d} />
    </svg>
  );
}
