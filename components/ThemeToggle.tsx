'use client';

import { useCallback, useEffect, useState } from 'react';

import { MonitorIcon, MoonIcon, SunIcon } from '@/components/Icons';
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type ThemeMode } from '@/lib/events';
import { cn } from '@/lib/utils';

const ORDER: ThemeMode[] = ['light', 'dark', 'system'];

const LABELS: Record<ThemeMode, string> = {
  light: '浅色模式',
  dark: '深色模式',
  system: '跟随系统',
};

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(mode: ThemeMode): void {
  const isDark = resolveIsDark(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
  document.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function readStoredTheme(): ThemeMode {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

/** 浅色 / 深色 / 跟随系统，三态循环切换。视觉上只是一个 28px 的图标按钮。 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>('system');

  // 真实值在挂载后从 localStorage 读取，避免服务端 HTML 与客户端不一致
  useEffect(() => {
    setMode(readStoredTheme());
  }, []);

  // 跟随系统时，实时响应系统主题变化
  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  const Icon = mode === 'light' ? SunIcon : mode === 'dark' ? MoonIcon : MonitorIcon;

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn('btn-ghost h-8 w-8 !px-0', className)}
      aria-label={`切换主题（当前：${LABELS[mode]}）`}
      title={`主题：${LABELS[mode]}`}
    >
      <Icon className="h-[1.05rem] w-[1.05rem]" />
    </button>
  );
}
