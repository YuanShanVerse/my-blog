/**
 * 跨组件通信用的轻量事件总线常量。
 * 放在独立模块里，避免在服务端组件中引用客户端组件的导出值。
 */

export const OPEN_SEARCH_EVENT = 'blog:open-search';

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_CHANGE_EVENT = 'blog:theme-change';

/** 触发搜索面板（由 Header / MobileNav 等调用） */
export function openSearch(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}
