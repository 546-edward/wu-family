'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getFamilyConfig } from '@/lib/content'

/** 访客导航：家族展示内容，无需登录即可浏览 */
const publicLinks = [
  { href: '/', label: '首页' },
  { href: '/genealogy', label: '世系树' },
  { href: '/announcements', label: '公告' },
  { href: '/gallery', label: '相册' },
]

/**
 * 全局导航栏。
 *
 * 访问模型：
 * - 展示内容对所有人开放，无需登录
 * - 导航栏右侧始终提供入口：未登录显示「管理员登录」，
 *   已登录显示「管理后台」，让维护人员随时能进入后台
 *
 * 登录态由服务端（layout）判定后经 props 传入：
 * 本组件是客户端组件，不直接依赖数据库与会话模块。
 */
export default function Nav({
  isAdmin = false,
}: {
  /** 当前是否已登录管理员 */
  isAdmin?: boolean
}) {
  const family = getFamilyConfig()
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const adminHref = isAdmin ? '/admin' : '/admin/login'
  const adminLabel = isAdmin ? '管理后台' : '管理员登录'
  const adminActive = pathname.startsWith('/admin')

  return (
    <header className="sticky top-0 z-40 border-b border-brand-accent/35 bg-brand-paper/92 backdrop-blur">
      {/* 顶部分隔细条 */}
      <div
        aria-hidden
        className="h-1 w-full bg-gradient-to-r from-transparent via-brand-accent to-transparent"
      />
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 md:px-8">
        <Link
          href="/"
          className="font-title text-3xl font-semibold tracking-widest text-brand-primary transition-opacity hover:opacity-80 md:text-4xl"
        >
          {family.shortName}
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg md:text-xl">
            {publicLinks.map(({ href, label }) => {
              const active = isActive(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={
                      'relative inline-block px-3.5 py-1.5 transition-colors md:px-4 ' +
                      (active
                        ? 'text-brand-primary after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:bg-brand-accent md:after:inset-x-4'
                        : 'text-brand-ink/75 hover:text-brand-primary')
                    }
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* 管理入口：与内容导航用细线稍作分隔，表明它属于另一类操作 */}
          <Link
            href={adminHref}
            aria-current={adminActive ? 'page' : undefined}
            className={
              'rounded-sm border px-3.5 py-1.5 text-base transition-colors ' +
              (adminActive
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-brand-accent/45 text-brand-ink/70 hover:border-brand-primary hover:text-brand-primary')
            }
          >
            {adminLabel}
          </Link>
        </div>
      </nav>
    </header>
  )
}
