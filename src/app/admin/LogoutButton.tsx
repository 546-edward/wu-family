'use client'

import { useTransition } from 'react'
import { logoutAction } from './actions'

/** 退出登录按钮，走 Server Action 清除会话 Cookie */
export default function LogoutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => logoutAction())}
      className="rounded-sm border border-brand-accent/40 px-3.5 py-2 text-sm text-brand-ink/70 transition-colors hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
    >
      {pending ? '退出中…' : '退出登录'}
    </button>
  )
}
