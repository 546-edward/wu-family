'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: '概览' },
  { href: '/admin/announcements', label: '公告管理' },
  { href: '/admin/excel', label: 'Excel 管理' },
]

/** 后台导航，当前页高亮 */
export default function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <nav aria-label="后台导航">
      <ul className="flex flex-wrap gap-2">
        {links.map(({ href, label }) => {
          const active = isActive(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={
                  'inline-block rounded-sm border px-4 py-2 text-[15px] transition-colors ' +
                  (active
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-brand-accent/35 text-brand-ink/75 hover:border-brand-primary hover:text-brand-primary')
                }
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
