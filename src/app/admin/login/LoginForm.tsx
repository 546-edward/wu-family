'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from './actions'

const initialState: LoginState = { error: null }

/**
 * 登录表单。
 * 提交走 Server Action（见 actions.ts），密码不经客户端逻辑处理，
 * 失败时统一提示「用户名或密码错误」，不区分具体原因。
 */
export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="card-cn space-y-5 rounded-sm p-6 md:p-7">
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm text-brand-ink/70"
        >
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          defaultValue="admin"
          className="w-full rounded-sm border border-brand-accent/35 bg-white/80 px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-brand-primary"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm text-brand-ink/70"
        >
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="w-full rounded-sm border border-brand-accent/35 bg-white/80 px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-brand-primary"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-brand-primary/40 bg-brand-primary/5 px-3 py-2.5 text-sm text-brand-primary"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-brand-primary px-4 py-2.5 text-[15px] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '登录中…' : '登录'}
      </button>

      <p className="text-center text-xs text-brand-ink/45">
        密码由维护人员在服务器环境变量中配置
      </p>
    </form>
  )
}
