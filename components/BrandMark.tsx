import type { ImgHTMLAttributes, SVGProps } from 'react';

import brand from '@/config/brand.json';

/**
 * 品牌图形资产。
 *
 * 字形几何数据统一放在 config/brand.json；山形使用样张 B 的墨迹图。
 */

/** 样张 B 中间的水墨山形，作为装饰与字标搭配使用。 */
export function MountainMark({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/images/mountain-ink.webp"
      width={640}
      height={427}
      alt=""
      aria-hidden="true"
      className={`mountain-mark ${className}`}
      {...props}
    />
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
