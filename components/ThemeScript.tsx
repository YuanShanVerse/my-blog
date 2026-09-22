import { THEME_STORAGE_KEY } from '@/lib/events';

/**
 * 在 <head> 里内联执行的极小脚本：在首屏渲染前决定用哪套主题。
 * 这样深色模式不会出现「先白后黑」的闪屏，代价只有一行同步脚本。
 */
const themeScript = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=s==='dark'||(s==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
