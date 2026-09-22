'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { CheckIcon } from '@/components/Icons';
import {
  createCaptcha,
  createGuestbookStore,
  validateGuestbookInput,
  type GuestbookEntry,
} from '@/lib/guestbook';
import { cn, formatDateTime, initialOf } from '@/lib/utils';

/**
 * 留言板。
 * 第一版没有后端：数据存在浏览器 localStorage（配有示例留言），
 * 表单校验 / 防刷逻辑已经按「将来要放到服务端」的方式写好，接 Supabase 时组件无需改动。
 */

const MESSAGE_MAX = 400;

interface FormState {
  name: string;
  message: string;
  honeypot: string;
  captcha: string;
}

const EMPTY_FORM: FormState = { name: '', message: '', honeypot: '', captcha: '' };

export function GuestbookBoard({ initialEntries }: { initialEntries: GuestbookEntry[] }) {
  const { store, mode } = useMemo(() => createGuestbookStore(), []);
  const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [captcha, setCaptcha] = useState<{ question: string; answer: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<number | undefined>(undefined);

  /* 验证码与本地数据都要在挂载后处理，避免服务端 / 客户端渲染不一致 */
  useEffect(() => {
    setCaptcha(createCaptcha());
    store
      .list()
      .then((list) => setEntries(list))
      .catch(() => setNotice('留言加载失败，请刷新页面重试。'));
  }, [store]);

  const update = useCallback((changes: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...changes }));
    setErrors({});
    setNotice(null);
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!captcha) return;

    const result = validateGuestbookInput({
      name: form.name,
      message: form.message,
      honeypot: form.honeypot,
      captcha: form.captcha,
      captchaExpected: captcha.answer,
      lastSubmittedAt,
    });
    setErrors(result.errors);

    if (!result.ok) return;

    setSubmitting(true);
    try {
      const created = await store.create(result.values);
      setEntries((current) => [created, ...current]);
      setForm(EMPTY_FORM);
      setCaptcha(createCaptcha());
      setLastSubmittedAt(Date.now());
      setNotice(
        mode === 'local' ? '留言已保存（本地演示模式，仅存在你的浏览器里）。' : '留言已提交。',
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '提交失败，请稍后再试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
      {/* 留言列表 */}
      <div className="order-2 lg:order-1">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="text-2xs uppercase tracking-[0.2em] text-faint">留言</h2>
          <span className="text-xs tabular-nums text-faint">{entries.length} 条</span>
        </div>

        {entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-faint">还没有留言，来做第一个吧。</p>
        ) : (
          <ul className="divide-list">
            {entries.map((entry) => (
              <li key={entry.id} className="flex gap-4 py-6">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xs font-medium text-muted"
                >
                  {initialOf(entry.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-fg">{entry.name}</span>
                    <time className="text-xs tabular-nums text-faint">
                      {formatDateTime(entry.createdAt)}
                    </time>
                    {entry.status === 'pending' && (
                      <span className="rounded border border-line px-1.5 py-0.5 text-2xs text-faint">
                        待审核
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed text-muted">
                    {entry.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 留言表单 */}
      <div className="order-1 lg:order-2">
        <form onSubmit={onSubmit} className="lg:sticky lg:top-24">
          <h2 className="text-2xs uppercase tracking-[0.2em] text-faint">写留言</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="gb-name" className="mb-1.5 block text-xs text-muted">
                昵称
              </label>
              <input
                id="gb-name"
                value={form.name}
                onChange={(event) => update({ name: event.target.value })}
                maxLength={24}
                required
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-faint"
                placeholder="怎么称呼你？"
              />
              {errors['name'] && <p className="mt-1.5 text-xs text-accent">{errors['name']}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="gb-message" className="text-xs text-muted">
                  留言
                </label>
                <span className="text-2xs tabular-nums text-faint">
                  {form.message.length}/{MESSAGE_MAX}
                </span>
              </div>
              <textarea
                id="gb-message"
                value={form.message}
                onChange={(event) => update({ message: event.target.value.slice(0, MESSAGE_MAX) })}
                rows={5}
                required
                className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-fg outline-none transition-colors placeholder:text-faint focus:border-faint"
                placeholder="想说什么都可以，尽量具体一点 :)"
              />
              {errors['message'] && <p className="mt-1.5 text-xs text-accent">{errors['message']}</p>}
            </div>

            {/* 蜜罐字段：对人类不可见，被填写即判定为机器人 */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="gb-website">Website</label>
              <input
                id="gb-website"
                tabIndex={-1}
                autoComplete="off"
                value={form.honeypot}
                onChange={(event) => update({ honeypot: event.target.value })}
              />
            </div>

            <div>
              <label htmlFor="gb-captcha" className="mb-1.5 block text-xs text-muted">
                验证码{captcha ? `：${captcha.question}` : ''}
              </label>
              <input
                id="gb-captcha"
                value={form.captcha}
                onChange={(event) => update({ captcha: event.target.value })}
                inputMode="numeric"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-faint"
                placeholder={captcha ? '填写计算结果' : '加载中…'}
                disabled={!captcha}
              />
              {errors['captcha'] && <p className="mt-1.5 text-xs text-accent">{errors['captcha']}</p>}
            </div>

            {errors['form'] && <p className="text-xs text-accent">{errors['form']}</p>}

            <button
              type="submit"
              disabled={submitting || !captcha}
              className={cn(
                'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-fg text-sm font-medium text-bg transition-opacity',
                (submitting || !captcha) && 'cursor-not-allowed opacity-60',
              )}
            >
              {submitting ? '提交中…' : '发布留言'}
            </button>

            {notice && (
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted">
                <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                {notice}
              </p>
            )}

            <p className="border-t border-line pt-4 text-2xs leading-relaxed text-faint">
              {mode === 'local'
                ? '当前为本地演示模式：留言只保存在这台设备的浏览器里，不会上传。'
                : '留言会提交到远端存储，审核通过后展示。'}
              <br />
              已内置长度限制、XSS 过滤、蜜罐字段、算术验证码与提交限流；接入后端后需在服务端再校验一次。
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
