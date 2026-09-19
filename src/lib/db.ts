import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { announcements as seedAnnouncements } from '@/content/announcements'

/**
 * SQLite 连接与建表。
 *
 * 设计要点：
 * - 数据库文件与上传的 Excel 原件都放在 `data/` 目录，该目录**不在 public/ 下**，
 *   因此不会被静态服务直接暴露出去（已在 .gitignore 中忽略）。
 * - 单例连接：开发模式下 Next.js 会热重载模块，用 globalThis 缓存避免重复打开。
 * - 建表语句使用 IF NOT EXISTS，启动时幂等执行。
 */

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'wufamily.db')
/** Excel 原件存放目录（非公开） */
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')

declare global {
  var __wuDb: Database.Database | undefined
}

function ensureDirs() {
  for (const dir of [DATA_DIR, UPLOAD_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
}

/** 建表 + 首次导入现有公告 */
function migrate(db: Database.Database) {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    -- 管理员账号（当前为单账号，保留多账号扩展空间）
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 公告
    CREATE TABLE IF NOT EXISTS announcements (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      content      TEXT NOT NULL,
      author_name  TEXT NOT NULL,
      published_at TEXT NOT NULL,
      is_pinned    INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ann_published
      ON announcements (is_pinned DESC, published_at DESC);

    -- 公告附件（文档 / 表格 / 图片等）
    CREATE TABLE IF NOT EXISTS attachments (
      id              TEXT PRIMARY KEY,
      announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
      file_name       TEXT NOT NULL,
      stored_name     TEXT NOT NULL,
      mime_type       TEXT NOT NULL,
      size_bytes      INTEGER NOT NULL,
      uploaded_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_att_ann
      ON attachments (announcement_id, uploaded_at);
  `)

  /*
   * 历史迁移：早期版本把「Excel 管理」做成了独立模块（uploads / upload_rows），
   * 后改为「公告附件」。这里把废弃表删掉，避免旧库残留。
   * 若旧表仍有数据，先备份到 JSON 再删除，以免误删。
   */
  dropLegacyExcelTables(db)

  /*
   * 清理孤儿附件：公告已被删除、但附件记录尚存的情况。
   *
   * 正常情况下外键的 ON DELETE CASCADE 会处理；但若有人直接改库、
   * 或早期版本遗留，就会产生脏数据。启动时掃一遍并删除对应磁盘文件。
   */
  cleanupOrphanAttachments(db)
}

/** 清理孤儿附件记录与对应磁盘文件 */
function cleanupOrphanAttachments(db: Database.Database) {
  const orphans = db
    .prepare(
      `SELECT a.id, a.stored_name FROM attachments a
        LEFT JOIN announcements n ON a.announcement_id = n.id
        WHERE n.id IS NULL`
    )
    .all() as { id: string; stored_name: string }[]
  if (orphans.length === 0) return

  for (const o of orphans) {
    // 路径校验：确保只删 UPLOAD_DIR 之内的文件
    const target = path.resolve(UPLOAD_DIR, o.stored_name)
    if (target.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
      try {
        fs.unlinkSync(target)
      } catch {
        // 文件已不存在则忽略
      }
    }
  }
  db.prepare(
    `DELETE FROM attachments WHERE announcement_id NOT IN
       (SELECT id FROM announcements)`
  ).run()

  console.log(`[WuFamily] 已清理 ${orphans.length} 个孤儿附件`)
}

function dropLegacyExcelTables(db: Database.Database) {
  const exists = (name: string) =>
    Boolean(
      db
        .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
        .get(name)
    )

  if (!exists('uploads')) return

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM uploads').get() as {
    count: number
  }
  if (count > 0) {
    // 有数据则导出备份文件，不静默丢失
    const backupDir = path.join(DATA_DIR, 'legacy-backup')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
    const rows = db.prepare('SELECT * FROM uploads').all()
    fs.writeFileSync(
      path.join(backupDir, 'uploads.json'),
      JSON.stringify(rows, null, 2)
    )
    console.warn(
      `[WuFamily] 检测到旧版 Excel 数据 ${count} 条，已备份到 data/legacy-backup/uploads.json`
    )
  }

  db.exec('DROP TABLE IF EXISTS upload_rows; DROP TABLE IF EXISTS uploads;')
}

/**
 * 首次启动时，若公告表为空，则把 `src/content/announcements.ts` 中的
 * 既有公告导入数据库，保证升级后网站内容不会突然变空。
 * 原始文件保留，作为版本管理与内容兜底。
 */
function seedIfEmpty(db: Database.Database) {
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM announcements')
    .get() as { count: number }
  if (count > 0) return

  const insert = db.prepare(`
    INSERT INTO announcements (id, title, content, author_name, published_at, is_pinned)
    VALUES (@id, @title, @content, @authorName, @publishedAt, @isPinned)
  `)
  const tx = db.transaction(() => {
    for (const a of seedAnnouncements) {
      insert.run({
        id: a.id,
        title: a.title,
        content: a.content,
        authorName: a.authorName,
        publishedAt: a.publishedAt,
        isPinned: a.isPinned ? 1 : 0,
      })
    }
  })
  tx()
}

/**
 * 管理员账号初始化。
 * 用户名与密码取自环境变量；密码以 bcrypt 哈希存储，不存明文。
 * 若管理员已存在则跳过（改密码请删除 data/wufamily.db 或直接改库）。
 */
function seedAdmin(db: Database.Database) {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD

  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM users')
    .get() as { count: number }
  if (count > 0) return

  if (!password) {
    console.warn(
      '[WuFamily] 未设置 ADMIN_PASSWORD，管理员账号尚未创建。' +
        '请在 .env.local 中设置后重启服务。'
    )
    return
  }

  const hash = bcrypt.hashSync(password, 10)
  db.prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  ).run(username, hash)
  console.log(`[WuFamily] 已创建管理员账号：${username}`)
}

/** 获取数据库单例（含建表与初始化） */
export function getDb(): Database.Database {
  if (globalThis.__wuDb) return globalThis.__wuDb

  ensureDirs()
  const db = new Database(DB_PATH)
  migrate(db)
  seedIfEmpty(db)
  seedAdmin(db)

  globalThis.__wuDb = db
  return db
}
