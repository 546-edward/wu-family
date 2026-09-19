import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: '管理员登录',
  robots: { index: false, follow: false },
}

/**
 * 管理员登录页。
 * 已登录则直接跳转后台首页，避免重复登录。
 */
export default async function LoginPage() {
  if (await isAuthenticated()) redirect('/admin')

  return (
    <div className="mx-auto max-w-md py-8">
      <header className="mb-8 text-center">
        <h1 className="font-title text-3xl tracking-[0.2em] text-brand-primary">
          管理员登录
        </h1>
        <p className="mt-3 text-sm text-brand-ink/60">
          仅限家族网站维护人员使用
        </p>
      </header>

      <hr className="rule-festive mb-8" />

      <LoginForm />
    </div>
  )
}
