'use server'

import fs from 'node:fs/promises'
import path from 'node:path'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/guard'
import { UPLOAD_DIR } from '@/lib/db'
import {
  createAttachment,
  deleteAttachment,
  deleteAnnouncement,
  getAnnouncement,
  saveAnnouncement,
} from '@/lib/queries'
import {
  MAX_ATTACHMENTS,
  randomStoredName,
  validateAttachment,
} from '@/lib/attachments'

export interface AnnouncementFormState {
  error: string | null
  fieldErrors?: Partial<
    Record<'title' | 'content' | 'authorName' | 'publishedAt', string>
  >
}

/**
 * 新增 / 更新公告，并处理随附的附件。
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

  // 先校验附件，避免公告已写入后才发现文件不合法
  const files = formData
    .getAll('attachments')
    .filter((f): f is File => f instanceof File && f.size > 0)

  if (files.length > MAX_ATTACHMENTS) {
    return { error: `一次最多上传 ${MAX_ATTACHMENTS} 个附件` }
  }

  const validated: { file: File; mimeType: string; ext: string }[] = []
  for (const file of files) {
    const check = validateAttachment({ name: file.name, size: file.size })
    if (!check.ok) return { error: check.error }
    validated.push({ file, mimeType: check.mimeType, ext: check.ext })
  }

  const announcementId = saveAnnouncement({
    id,
    title,
    content,
    authorName,
    publishedAt,
    isPinned,
  })

  // 写入附件：先落库再写盘，任一步失败即回滚已写入的文件
  const written: string[] = []
  try {
    for (const { file, mimeType, ext } of validated) {
      const storedName = randomStoredName(ext)
      const attId = `f-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`

      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.writeFile(path.join(UPLOAD_DIR, storedName), buffer)
      written.push(storedName)

      createAttachment({
        id: attId,
        announcementId,
        fileName: file.name,
        storedName,
        mimeType,
        sizeBytes: file.size,
      })
    }
  } catch (err) {
    // 清理本次已写入的文件，避免留下孤儿文件
    await Promise.all(
      written.map((name) =>
        fs.unlink(path.join(UPLOAD_DIR, name)).catch(() => {})
      )
    )
    const msg = err instanceof Error ? err.message : '未知错误'
    return { error: `附件保存失败：${msg}` }
  }

  revalidateAnnouncementPages(announcementId)
  redirect('/admin/announcements')
}

/** 删除公告（连同附件记录与磁盘文件） */
export async function deleteAnnouncementAction(formData: FormData): Promise<void> {
  await requireAuth()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const storedNames = deleteAnnouncement(id)
  await Promise.all(
    storedNames.map((name) => removeStoredFile(name))
  )

  revalidateAnnouncementPages(id)
}

/** 单独删除某个附件（编辑公告时使用） */
export async function deleteAttachmentAction(formData: FormData): Promise<void> {
  await requireAuth()
  const attachmentId = String(formData.get('attachmentId') ?? '').trim()
  const announcementId = String(formData.get('announcementId') ?? '').trim()
  if (!attachmentId) return

  const storedName = deleteAttachment(attachmentId)
  if (storedName) await removeStoredFile(storedName)

  revalidateAnnouncementPages(announcementId)
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

  revalidateAnnouncementPages(id)
}

/* --------------------------------- 内部工具 -------------------------------- */

/** 删除磁盘上的附件原件，并校验路径始终落在 UPLOAD_DIR 之内 */
async function removeStoredFile(storedName: string): Promise<void> {
  const target = path.resolve(UPLOAD_DIR, storedName)
  if (!target.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) return
  await fs.unlink(target).catch(() => {})
}

/** 刷新受公告影响的页面 */
function revalidateAnnouncementPages(id: string): void {
  revalidatePath('/announcements')
  revalidatePath('/')
  revalidatePath('/admin/announcements')
  if (id) revalidatePath(`/announcements/${id}`)
}
