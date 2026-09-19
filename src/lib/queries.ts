import type { Announcement, Attachment } from '@/types'
import { getDb } from '@/lib/db'

/**
 * 数据库读写封装。
 * 页面（含前台展示页与后台管理页）一律经此模块访问数据，
 * 不直接写 SQL，便于统一处理排序、分页与字段映射。
 */

/* --------------------------------- 公告附件 -------------------------------- */

interface AttachmentRow {
  id: string
  announcement_id: string
  file_name: string
  stored_name: string
  mime_type: string
  size_bytes: number
  uploaded_at: string
}

function mapAttachment(r: AttachmentRow): Attachment {
  return {
    id: r.id,
    announcementId: r.announcement_id,
    fileName: r.file_name,
    storedName: r.stored_name,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    uploadedAt: r.uploaded_at,
  }
}

const ATT_COLS = `id, announcement_id, file_name, stored_name,
                  mime_type, size_bytes, uploaded_at`

/** 取某条公告的全部附件 */
export function listAttachments(announcementId: string): Attachment[] {
  const rows = getDb()
    .prepare(
      `SELECT ${ATT_COLS} FROM attachments
        WHERE announcement_id = ? ORDER BY uploaded_at`
    )
    .all(announcementId) as AttachmentRow[]
  return rows.map(mapAttachment)
}

/** 取单个附件（下载时校验存在性） */
export function getAttachment(id: string): Attachment | null {
  const row = getDb()
    .prepare(`SELECT ${ATT_COLS} FROM attachments WHERE id = ?`)
    .get(id) as AttachmentRow | undefined
  return row ? mapAttachment(row) : null
}

/** 新增一条附件记录 */
export function createAttachment(input: {
  id: string
  announcementId: string
  fileName: string
  storedName: string
  mimeType: string
  sizeBytes: number
}): void {
  getDb()
    .prepare(
      `INSERT INTO attachments
         (id, announcement_id, file_name, stored_name, mime_type, size_bytes)
       VALUES (@id, @announcementId, @fileName, @storedName, @mimeType, @sizeBytes)`
    )
    .run(input)
}

/** 删除单条附件，返回存储文件名以便删除磁盘原件 */
export function deleteAttachment(id: string): string | null {
  const att = getAttachment(id)
  if (!att) return null
  getDb().prepare('DELETE FROM attachments WHERE id = ?').run(id)
  return att.storedName
}

/* ---------------------------------- 公告 ---------------------------------- */

interface AnnouncementRow {
  id: string
  title: string
  content: string
  author_name: string
  published_at: string
  is_pinned: number
}

function mapAnnouncement(r: AnnouncementRow, attachments: Attachment[] = []): Announcement {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    authorName: r.author_name,
    publishedAt: r.published_at,
    isPinned: r.is_pinned === 1,
    attachments,
  }
}

/**
 * 公告列表：置顶优先，其余按发布时间倒序。
 *
 * 附件用**一次批量查询**取回后按公告分组，避免逐条查询造成 N+1。
 */
export function listAnnouncements(): Announcement[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, title, content, author_name, published_at, is_pinned
         FROM announcements
        ORDER BY is_pinned DESC, published_at DESC, created_at DESC`
    )
    .all() as AnnouncementRow[]

  if (rows.length === 0) return []

  const all = db
    .prepare(`SELECT ${ATT_COLS} FROM attachments ORDER BY uploaded_at`)
    .all() as AttachmentRow[]

  const grouped = new Map<string, Attachment[]>()
  for (const a of all) {
    const list = grouped.get(a.announcement_id) ?? []
    list.push(mapAttachment(a))
    grouped.set(a.announcement_id, list)
  }

  return rows.map((r) => mapAnnouncement(r, grouped.get(r.id) ?? []))
}

/** 按 id 取单条公告（含附件） */
export function getAnnouncement(id: string): Announcement | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT id, title, content, author_name, published_at, is_pinned
         FROM announcements WHERE id = ?`
    )
    .get(id) as AnnouncementRow | undefined
  if (!row) return null

  const atts = db
    .prepare(
      `SELECT ${ATT_COLS} FROM attachments
        WHERE announcement_id = ? ORDER BY uploaded_at`
    )
    .all(id) as AttachmentRow[]

  return mapAnnouncement(row, atts.map(mapAttachment))
}

/** 新增或更新公告（后台表单提交） */
export function saveAnnouncement(input: {
  id?: string
  title: string
  content: string
  authorName: string
  publishedAt: string
  isPinned: boolean
}): string {
  const db = getDb()

  if (input.id && getAnnouncement(input.id)) {
    db.prepare(
      `UPDATE announcements
          SET title = @title, content = @content, author_name = @authorName,
              published_at = @publishedAt, is_pinned = @isPinned,
              updated_at = datetime('now')
        WHERE id = @id`
    ).run({ ...input, isPinned: input.isPinned ? 1 : 0 })
    return input.id
  }

  const id = input.id?.trim() || `a-${Date.now().toString(36)}`
  db.prepare(
    `INSERT INTO announcements
       (id, title, content, author_name, published_at, is_pinned)
     VALUES (@id, @title, @content, @authorName, @publishedAt, @isPinned)`
  ).run({
    id,
    title: input.title,
    content: input.content,
    authorName: input.authorName,
    publishedAt: input.publishedAt,
    isPinned: input.isPinned ? 1 : 0,
  })
  return id
}

/**
 * 删除公告。
 * 附件记录由外键级联删除，但磁盘文件需调用方先取出文件名再清理，
 * 因此这里返回该公告的全部存储文件名。
 */
export function deleteAnnouncement(id: string): string[] {
  const db = getDb()
  const atts = db
    .prepare('SELECT stored_name FROM attachments WHERE announcement_id = ?')
    .all(id) as { stored_name: string }[]
  db.prepare('DELETE FROM announcements WHERE id = ?').run(id)
  return atts.map((a) => a.stored_name)
}