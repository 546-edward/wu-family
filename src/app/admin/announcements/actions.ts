'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/guard'
import {
  deleteAnnouncement,
  getAnnouncement,
  saveAnnouncement,
} from '@/lib/queries'

export interface AnnouncementFormState {
  error: string | null
  fieldErrors?: Partial<Record<'title' | 'content' | 'authorName' | 'publishedAt', string>>
}

/**
 * 新增 / 更新公告。
 *
 * 每个 action 都先调用 `requireAuth()`：Server Action 不经过 layout，
 * 若不单独校验，未登录者可直接构造请求写入数据。
 */
export async function saveAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  await requireAuth()

  const id = String(formData.get('id') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const authorName = String(formData.get('authorName') ?? '').trim()
  const publishedAt = String(formData.get('publishedAt') ?? '').trim()
  const isPinned = formData.get('isPinned') === 'on'

  // 服务端校验（不依赖前端校验）
  const fieldErrors: AnnouncementFormState['fieldErrors'] = {}
  if (!title) fieldErrors.title = '请填写标题'
  else if (title.length > 120) fieldErrors.title = '标题不超过 120 字'
  if (!content) fieldErrors.content = '请填写正文'
  if (!authorName) fieldErrors.authorName = '请填写署名'
  if (!publishedAt) fieldErrors.publishedAt = '请选择发布日期'
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt))
    fieldErrors.publishedAt = '日期格式应为 YYYY-MM-DD'

  if (Object.keys(fieldErrors).length > 0) {
    return { error: '请检查表单填写', fieldErrors }
  }

  saveAnnouncement({ id, title, content, authorName, publishedAt, isPinned })

  // 前台展示页与后台列表页都需刷新
  revalidatePath('/announcements')
  revalidatePath('/')
  revalidatePath('/admin/announcements')
  redirect('/admin/announcements')
}

/** 删除公告 */
export async function deleteAnnouncementAction(formData: FormData): Promise<void> {
  await requireAuth()
  const id = String(formData.get('id') ?? '').trim()
  if (id && getAnnouncement(id)) {
    deleteAnnouncement(id)
    revalidatePath('/announcements')
    revalidatePath('/')
    revalidatePath('/admin/announcements')
  }
}

/** 快速切换置顶状态 */
export async function togglePinAction(formData: FormData): Promise<void> {
  await requireAuth()
  const id = String(formData.get('id') ?? '').trim()
  const existing = getAnnouncement(id)
  if (!existing) return

  saveAnnouncement({
    id: existing.id,
    title: existing.title,
    content: existing.content,
    authorName: existing.authorName,
    publishedAt: existing.publishedAt,
    isPinned: !existing.isPinned,
  })

  revalidatePath('/announcements')
  revalidatePath('/')
  revalidatePath('/admin/announcements')
}
