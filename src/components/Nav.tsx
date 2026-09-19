'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getFamilyConfig } from '@/lib/data'

const links = [
  { href: '/', label: '首页' },
  { href: '/genealogy', label: '世系树' },
  { href: '/announcements', label: '公告' },
  { href: '/gallery', label: '相册' },
]

/**
 * 全局导航栏。
 * 品牌名取自 `family.shortName`，当前页高亮由 `usePathname()` 判定。
 */
export default function Nav() {
  const family = getFamilyConfig()
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 border-b border-brand-accent/35 bg-brand-paper/92 backdrop-blur">
      {/* 顶部喜庆红金渐变条 */}
      <div
        aria-hidden
        className="h-1 w-full bg-gradient-to-r from-transparent via-brand-primary to-transparent"
      />
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 md:px-8">
        <Link
          href="/"
          className="font-title text-2xl font-semibold tracking-widest text-brand-primary transition-opacity hover:opacity-80"
        >
          {family.shortName}
        </Link>

        <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[15px]">
          {links.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={
                    'relative inline-block px-3 py-1.5 transition-colors ' +
                    (active
                      ? 'text-brand-primary after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:bg-brand-accent'
                      : 'text-brand-ink/70 hover:text-brand-primary')
                  }
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
