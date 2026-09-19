import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import AdminNav from './AdminNav'
import LogoutButton from './LogoutButton'

export const metadata: Metadata = {
  title: { default: '管理后台', template: '%s · 管理后台' },
  // 后台不应被搜索引擎收录
  robots: { index: false, follow: false },
}

/**
 * 后台布局：负责后台区域的统一外观（标题、导航、退出）。
 *
 * 鉴权**不在这里**判断：layout 与 page 是并行渲染的，仅靠 layout 无法
 * 阻止 page 的取数逻辑执行。真正的守卫在每个后台页面与 Server Action
 * 内部调用 `requireAuth()`（见 src/lib/guard.ts）。
 *
 * 未登录时 `getCurrentUser()` 返回 null，此时只渲染内容区，
 * 让登录页以干净的样式呈现。
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()

  if (!user) {
    return <div className="mx-auto w-full max-w-5xl">{children}</div>
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-title text-2xl tracking-[0.15em] text-brand-primary">
              管理后台
            </p>
            <p className="mt-1 text-sm text-brand-ink/55">已登录：{user}</p>
          </div>
          <LogoutButton />
        </div>
        <hr className="rule-festive mt-5" />
      </header>

      <AdminNav />
      <div className="mt-8">{children}</div>

      <p className="mt-10 border-t border-brand-accent/20 pt-4 text-xs text-brand-ink/45">
        返回{' '}
        <Link
          href="/"
          className="text-brand-primary underline-offset-4 hover:underline"
        >
          网站首页
        </Link>
      </p>
    </div>
  )
}
