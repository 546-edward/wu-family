import type { Metadata } from 'next'
import './globals.css'
import { getFamilyConfig } from '@/lib/data'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

/**
 * 全站元信息取自家族配置，组件与页面中不出现任何家族专属字样。
 * `generateMetadata` 在构建时求值，静态导出同样适用。
 */
export function generateMetadata(): Metadata {
  const family = getFamilyConfig()
  return {
    title: {
      default: family.name,
      template: `%s · ${family.shortName}`,
    },
    description: family.description,
  }
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const family = getFamilyConfig()

  return (
    <html lang="zh-CN">
      <body
        className="flex min-h-screen flex-col bg-brand-paper text-brand-ink"
        style={
          {
            '--theme-primary': family.theme.primary,
            '--theme-ink': family.theme.ink,
            '--theme-paper': family.theme.paper,
          } as React.CSSProperties
        }
      >
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8 md:py-14">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
