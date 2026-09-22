import { sanitizeText } from '@/lib/utils';

/**
 * 留言板数据层。
 *
 * 设计目标：UI 与存储解耦，未来接 Supabase / Firebase / PostgreSQL 时只换一个 Store 实现，
 * 组件代码不需要改动。
 *
 * 当前默认实现 LocalGuestbookStore：
 * - 数据存在浏览器 localStorage，第一版无需后端即可完整体验
 * - 内置 mock 数据，首次打开就有内容
 *
 * 升级路径（见 README「后续如何接入数据库」）：
 * 1. 在 Supabase 建表 guestbook(id, name, message, created_at, status)
 * 2. 实现 RemoteGuestbookStore（下方已给出骨架）
 * 3. 在 createGuestbookStore() 里按环境变量切换
 */

export type GuestbookStatus = 'approved' | 'pending';

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  /** ISO 时间字符串 */
  createdAt: string;
  status: GuestbookStatus;
}

export interface NewGuestbookEntry {
  name: string;
  message: string;
}

export interface GuestbookStore {
  list(): Promise<GuestbookEntry[]>;
  create(entry: NewGuestbookEntry): Promise<GuestbookEntry>;
}

const STORAGE_KEY = 'guestbook:entries:v1';

/** 首次打开时展示的示例留言（可在接后端后删除） */
export const mockEntries: GuestbookEntry[] = [
  {
    id: 'seed-1',
    name: 'Lin',
    message:
      '偶然搜到你的博客，很喜欢这种干净的排版。关于知识库那篇我看了两遍，回去就把自己的笔记整理了一遍。',
    createdAt: '2026-09-16T10:24:00.000Z',
    status: 'approved',
  },
  {
    id: 'seed-2',
    name: '小舟',
    message: '写的投资记录很诚实，尤其是承认自己犯错的那部分。期待后续。',
    createdAt: '2026-09-11T03:08:00.000Z',
    status: 'approved',
  },
  {
    id: 'seed-3',
    name: 'Alex',
    message: 'RSS 订阅了。请保持更新 :)',
    createdAt: '2026-09-04T14:52:00.000Z',
    status: 'approved',
  },
];

/* --------------------------------- 校验与防刷 --------------------------------- */

export interface GuestbookFormInput {
  name: string;
  message: string;
  /** 蜜罐字段：正常用户看不到，填写了就是机器人 */
  honeypot?: string;
  /** 简单算术验证码答案 */
  captcha?: string;
  /** 验证码题目期望值 */
  captchaExpected?: string;
  /** 上次提交时间戳，用于限流 */
  lastSubmittedAt?: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<'name' | 'message' | 'captcha' | 'form', string>>;
  values: NewGuestbookEntry;
}

const NAME_MIN = 1;
const NAME_MAX = 24;
const MESSAGE_MIN = 2;
const MESSAGE_MAX = 400;
const RATE_LIMIT_MS = 30_000;

/** 简单的垃圾内容特征（可按需扩充，或改为服务端审核） */
const SPAM_PATTERNS: RegExp[] = [
  /https?:\/\/\S+/gi,
  /\b(viagra|casino|porn|loan|crypto\s?pump)\b/i,
  /(加微信|代开发票|博彩|赌场|色情)/,
];

function countLinks(text: string): number {
  return (text.match(/https?:\/\//gi) ?? []).length;
}

/**
 * 校验留言输入：长度、XSS、验证码、限流、垃圾特征。
 * 真实项目里同样的规则要在服务端再跑一遍（前端校验只是体验优化）。
 */
export function validateGuestbookInput(input: GuestbookFormInput): ValidationResult {
  const name = sanitizeText(input.name, NAME_MAX);
  const message = sanitizeText(input.message, MESSAGE_MAX);
  const errors: ValidationResult['errors'] = {};

  if (input.honeypot && input.honeypot.trim().length > 0) {
    errors.form = '提交被拦截：疑似自动程序。';
  }

  if (name.length < NAME_MIN) errors.name = '请填写昵称。';
  if (message.length < MESSAGE_MIN) errors.message = '请填写留言内容。';
  if (input.message.length > MESSAGE_MAX) {
    errors.message = `留言不能超过 ${MESSAGE_MAX} 个字符。`;
  }

  if (input.captchaExpected && input.captcha?.trim() !== input.captchaExpected) {
    errors.captcha = '验证码不正确，请再试一次。';
  }

  if (countLinks(message) > 2) {
    errors.message = '留言中链接过多，请减少后再提交。';
  }
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(message)) {
      errors.message = '留言包含被限制的内容，请调整后再提交。';
      break;
    }
  }

  if (input.lastSubmittedAt && Date.now() - input.lastSubmittedAt < RATE_LIMIT_MS) {
    const seconds = Math.ceil((RATE_LIMIT_MS - (Date.now() - input.lastSubmittedAt)) / 1000);
    errors.form = `提交过于频繁，请 ${seconds} 秒后再试。`;
  }

  return { ok: Object.keys(errors).length === 0, errors, values: { name, message } };
}

/** 生成一个简单算术验证码（后续可换成 Turnstile / hCaptcha） */
export function createCaptcha(): { question: string; answer: string } {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 8);
  return { question: `${a} + ${b} = ?`, answer: String(a + b) };
}

/* --------------------------------- 本地实现 --------------------------------- */

function createId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 浏览器 localStorage 实现（第一版默认） */
export class LocalGuestbookStore implements GuestbookStore {
  async list(): Promise<GuestbookEntry[]> {
    const stored = this.read();
    const entries = [...stored, ...mockEntries];
    return entries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async create(entry: NewGuestbookEntry): Promise<GuestbookEntry> {
    const created: GuestbookEntry = {
      id: createId(),
      name: entry.name,
      message: entry.message,
      createdAt: new Date().toISOString(),
      status: 'approved',
    };
    this.write([created, ...this.read()]);
    return created;
  }

  private read(): GuestbookEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as GuestbookEntry[]) : [];
    } catch {
      return [];
    }
  }

  private write(entries: GuestbookEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* 隐私模式下 localStorage 可能不可写，忽略即可 */
    }
  }
}

/* --------------------------------- 远端骨架 --------------------------------- */

/**
 * 远端实现骨架（接 Supabase 时启用）。
 *
 * ```ts
 * import { createClient } from '@supabase/supabase-js';
 * const supabase = createClient(env.url, env.anonKey);
 *
 * async list() {
 *   const { data } = await supabase
 *     .from('guestbook')
 *     .select('*')
 *     .eq('status', 'approved')
 *     .order('created_at', { ascending: false });
 *   return data ?? [];
 * }
 * ```
 *
 * 注意：不要在前端直接开放 insert 权限，走 Edge Function / Supabase RLS + 服务端校验。
 */
export class RemoteGuestbookStore implements GuestbookStore {
  constructor(private readonly endpoint: string) {}

  async list(): Promise<GuestbookEntry[]> {
    const response = await fetch(this.endpoint, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`加载留言失败：${response.status}`);
    return (await response.json()) as GuestbookEntry[];
  }

  async create(entry: NewGuestbookEntry): Promise<GuestbookEntry> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error(`提交留言失败：${response.status}`);
    return (await response.json()) as GuestbookEntry;
  }
}

/** 选择存储实现：配置了 NEXT_PUBLIC_GUESTBOOK_ENDPOINT 就走远端，否则用本地演示模式 */
export function createGuestbookStore(): { store: GuestbookStore; mode: 'local' | 'remote' } {
  const endpoint = process.env['NEXT_PUBLIC_GUESTBOOK_ENDPOINT'];
  if (endpoint) {
    return { store: new RemoteGuestbookStore(endpoint), mode: 'remote' };
  }
  return { store: new LocalGuestbookStore(), mode: 'local' };
}
