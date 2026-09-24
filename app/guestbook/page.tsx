import type { Metadata } from 'next';

import { GuestbookBoard } from '@/components/GuestbookBoard';
import { mockEntries } from '@/lib/guestbook';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: '留言板',
  description: `给 ${site.author.name} 留言：想法、建议、纠错，或者只是打个招呼。`,
  alternates: { canonical: '/guestbook' },
};

/** 配置了 NEXT_PUBLIC_GUESTBOOK_ENDPOINT 就代表走远端存储，此时不注入本地示例数据 */
const isRemote = Boolean(process.env['NEXT_PUBLIC_GUESTBOOK_ENDPOINT']);

export default function GuestbookPage() {
  return (
    <div className="container-page py-20 sm:py-28">
      <header className="max-w-reading">
        <h1 className="t-page">留言板</h1>
        <p className="t-lead mt-5">
          看到错别字、有不同意见、想聊点什么，都可以写在这里。不需要注册。
        </p>
      </header>

      <GuestbookBoard initialEntries={isRemote ? [] : mockEntries} />
    </div>
  );
}
