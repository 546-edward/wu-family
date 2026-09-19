import type { Metadata } from 'next'
import './globals.css'
import { getFamilyConfig } from '@/lib/content'
import { isAuthenticated } from '@/lib/auth'
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const family = getFamilyConfig()
  // 服务端判定登录态，决定导航栏显示「管理员登录」还是「管理后台」。
  // 这里只影响入口文案，真正的权限在后台页面与 Server Action 中强制校验。
  const isAdmin = await isAuthenticated()

  return (
    <html lang="zh-CN">
      <body
        className="flex min-h-screen flex-col text-brand-ink"
        style={
          {
            '--theme-primary': family.theme.primary,
            '--theme-ink': family.theme.ink,
            '--theme-paper': family.theme.paper,
            '--theme-accent': family.theme.accent,
          } as React.CSSProperties
        }
      >
        <Nav isAdmin={isAdmin} />
        {/* 内容区置于半透明宣纸面板上，两侧露出国风底色纹理 */}
        <main className="paper-panel mx-auto my-6 w-[min(100%-1.5rem,76rem)] flex-1 px-5 py-10 md:my-10 md:px-10 md:py-14">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
