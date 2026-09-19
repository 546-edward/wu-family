import type { Announcement, Upload, UploadPage } from '@/types'
import { getDb } from '@/lib/db'

/**
 * 数据库读写封装。
 * 页面（含前台展示页与后台管理页）一律经此模块访问数据，
 * 不直接写 SQL，便于统一处理排序、分页与字段映射。
 */

/* ---------------------------------- 公告 ---------------------------------- */

interface AnnouncementRow {
  id: string
  title: string
  content: string
  author_name: string
  published_at: string
  is_pinned: number
}

function mapAnnouncement(r: AnnouncementRow): Announcement {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    authorName: r.author_name,
    publishedAt: r.published_at,
    isPinned: r.is_pinned === 1,
  }
}

/** 公告列表：置顶优先，其余按发布时间倒序 */
export function listAnnouncements(): Announcement[] {
  const rows = getDb()
    .prepare(
      `SELECT id, title, content, author_name, published_at, is_pinned
         FROM announcements
        ORDER BY is_pinned DESC, published_at DESC, created_at DESC`
    )
    .all() as AnnouncementRow[]
  return rows.map(mapAnnouncement)
}

/** 按 id 取单条公告 */
export function getAnnouncement(id: string): Announcement | null {
  const row = getDb()
    .prepare(
      `SELECT id, title, content, author_name, published_at, is_pinned
         FROM announcements WHERE id = ?`
    )
    .get(id) as AnnouncementRow | undefined
  return row ? mapAnnouncement(row) : null
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

/** 删除公告 */
export function deleteAnnouncement(id: string): void {
  getDb().prepare('DELETE FROM announcements WHERE id = ?').run(id)
}

/* ---------------------------------- Excel --------------------------------- */

interface UploadRow {
  id: string
  title: string
  file_name: string
  stored_name: string
  sheet_name: string
  row_count: number
  col_count: number
  columns: string
  size_bytes: number
  uploaded_at: string
}

function mapUpload(r: UploadRow): Upload {
  let columns: string[] = []
  try {
    const parsed = JSON.parse(r.columns)
    if (Array.isArray(parsed)) columns = parsed.map(String)
  } catch {
    // 表头解析失败时退化为空数组，不影响其余字段展示
  }
  return {
    id: r.id,
    title: r.title,
    fileName: r.file_name,
    storedName: r.stored_name,
    sheetName: r.sheet_name,
    rowCount: r.row_count,
    colCount: r.col_count,
    columns,
    sizeBytes: r.size_bytes,
    uploadedAt: r.uploaded_at,
  }
}

const UPLOAD_COLS = `id, title, file_name, stored_name, sheet_name,
                     row_count, col_count, columns, size_bytes, uploaded_at`

/** 全部分上传记录（按上传时间倒序） */
export function listUploads(): Upload[] {
  const rows = getDb()
    .prepare(`SELECT ${UPLOAD_COLS} FROM uploads ORDER BY uploaded_at DESC`)
    .all() as UploadRow[]
  return rows.map(mapUpload)
}

/** 取单条上传记录 */
export function getUpload(id: string): Upload | null {
  const row = getDb()
    .prepare(`SELECT ${UPLOAD_COLS} FROM uploads WHERE id = ?`)
    .get(id) as UploadRow | undefined
  return row ? mapUpload(row) : null
}

/**
 * 分页取某个上传的行数据。
 * 分页在数据库层完成（LIMIT/OFFSET），避免一次性把大表读进内存。
 */
export function getUploadPage(
  id: string,
  page = 1,
  pageSize = 20
): UploadPage | null {
  const upload = getUpload(id)
  if (!upload) return null

  const size = Math.max(1, Math.min(pageSize, 200))
  const totalRows = upload.rowCount
  const totalPages = Math.max(1, Math.ceil(totalRows / size))
  const current = Math.min(Math.max(1, page), totalPages)

  const rows = getDb()
    .prepare(
      `SELECT row_index, cells FROM upload_rows
        WHERE upload_id = ? ORDER BY row_index LIMIT ? OFFSET ?`
    )
    .all(id, size, (current - 1) * size) as {
    row_index: number
    cells: string
  }[]

  return {
    upload,
    rows: rows.map((r) => {
      let cells: string[] = []
      try {
        const parsed = JSON.parse(r.cells)
        if (Array.isArray(parsed)) cells = parsed.map(String)
      } catch {
        // 单行解析失败时以空行占位，不中断整页
      }
      return { rowIndex: r.row_index, cells }
    }),
    page: current,
    pageSize: size,
    totalRows,
    totalPages,
  }
}

/** 保存一次上传（记录 + 行数据），事务保证原子性 */
export function createUpload(input: {
  id: string
  title: string
  fileName: string
  storedName: string
  sheetName: string
  columns: string[]
  rows: string[][]
  sizeBytes: number
}): void {
  const db = getDb()
  const insertUpload = db.prepare(
    `INSERT INTO uploads
       (id, title, file_name, stored_name, sheet_name,
        row_count, col_count, columns, size_bytes)
     VALUES (@id, @title, @fileName, @storedName, @sheetName,
             @rowCount, @colCount, @columns, @sizeBytes)`
  )
  const insertRow = db.prepare(
    'INSERT INTO upload_rows (upload_id, row_index, cells) VALUES (?, ?, ?)'
  )

  const tx = db.transaction(() => {
    insertUpload.run({
      id: input.id,
      title: input.title,
      fileName: input.fileName,
      storedName: input.storedName,
      sheetName: input.sheetName,
      rowCount: input.rows.length,
      colCount: input.columns.length,
      columns: JSON.stringify(input.columns),
      sizeBytes: input.sizeBytes,
    })
    input.rows.forEach((cells, i) => {
      insertRow.run(input.id, i + 1, JSON.stringify(cells))
    })
  })
  tx()
}

/** 删除上传记录（行数据由外键级联删除）；返回存储文件名以便删除原件 */
export function deleteUpload(id: string): string | null {
  const upload = getUpload(id)
  if (!upload) return null
  getDb().prepare('DELETE FROM uploads WHERE id = ?').run(id)
  return upload.storedName
}
