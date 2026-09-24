import type { Metadata, Viewport } from 'next';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { SearchDialog } from '@/components/SearchDialog';
import { ThemeScript } from '@/components/ThemeScript';
import { absoluteUrl, contacts, site } from '@/lib/site';

import 'katex/dist/katex.min.css';
import '@/styles/fonts.css';
import '@/styles/globals.css';
import '@/styles/prose.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author.name, ...(contacts.github ? { url: contacts.github } : {}) }],
  creator: site.author.name,
  publisher: site.author.name,
  keywords: ['个人博客', '数字花园', 'AI', '投资', '读书笔记', '职业发展', '生活记录'],
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': absoluteUrl('/rss.xml') },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    images: [{ url: absoluteUrl('/og.png'), width: 1200, height: 630, alt: site.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.title,
    description: site.description,
    images: [absoluteUrl('/og.png')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#12110f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* suppressHydrationWarning：<head> 里的内联脚本会先给 html 加上 dark 类 */
    <html lang={site.lang} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-line focus:bg-bg focus:px-3 focus:py-2 focus:text-sm"
        >
          跳到主内容
        </a>
        <Header />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer />
        <SearchDialog />
      </body>
    </html>
  );
}
