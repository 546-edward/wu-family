'use server'

import { redirect } from 'next/navigation'
import { logout } from '@/lib/auth'

/** 退出登录 */
export async function logoutAction(): Promise<void> {
  await logout()
  redirect('/admin/login')
}
