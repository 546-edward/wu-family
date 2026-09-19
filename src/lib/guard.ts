import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

/**
 * 后台鉴权守卫。
 *
 * 用法：在每个受保护的后台**页面**与 **Server Action** 顶部调用。
 *
 * 为什么不只在 layout 里做：Next.js 的 layout 与 page 是并行渲染的，
 * 仅靠 layout 判断无法阻止 page 自身的取数逻辑执行，且 Server Action
 * 完全不经过 layout。因此在页面与 action 内部各校验一次，纵深防御。
 */
export async function requireAuth(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return user
}
