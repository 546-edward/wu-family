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

    -- Excel 上传记录（表头与元信息）
    CREATE TABLE IF NOT EXISTS uploads (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      file_name   TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      sheet_name  TEXT NOT NULL,
      row_count   INTEGER NOT NULL,
      col_count   INTEGER NOT NULL,
      columns     TEXT NOT NULL,   -- JSON 数组：表头
      size_bytes  INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Excel 行数据（每行一条，便于分页查询）
    CREATE TABLE IF NOT EXISTS upload_rows (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
      row_index INTEGER NOT NULL,
      cells     TEXT NOT NULL    -- JSON 数组：该行单元格文本
    );
    CREATE INDEX IF NOT EXISTS idx_rows_upload
      ON upload_rows (upload_id, row_index);
  `)
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
