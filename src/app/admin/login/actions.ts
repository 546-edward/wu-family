'use server'

import { redirect } from 'next/navigation'
import { login } from '@/lib/auth'

export interface LoginState {
  error: string | null
}

/**
 * 登录 Server Action。
 * 成功则跳转后台首页；失败返回统一错误信息。
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!username || !password) {
    return { error: '请输入用户名和密码' }
  }

  const result = await login(username, password)
  if (!result.ok) return { error: result.error }

  redirect('/admin')
}
