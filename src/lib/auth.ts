import 'server-only'
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'

/**
 * 管理员鉴权。
 *
 * 方案：签名 Cookie 会话。
 * - Cookie 值 = `base64(payload).hmacSHA256(payload)`
 * - 密钥来自 SESSION_SECRET，不可预测
 * - Cookie 为 httpOnly + SameSite=Lax，脚本无法读取，防 XSS 窃取
 * - 校验时用 timingSafeEqual 比较签名，避免时序攻击
 *
 * 不引入完整鉴权框架：单账号场景下，这比 NextAuth 之类更小更可控。
 */

const COOKIE_NAME = 'wu_admin'
/** 会话有效期：7 天 */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) {
    throw new Error(
      '缺少 SESSION_SECRET 环境变量。请在 .env.local 中设置一个随机字符串。'
    )
  }
  return s
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}

function createToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function verifyToken(token: string | undefined): string | null {
  if (!token) return null
  const idx = token.lastIndexOf('.')
  if (idx <= 0) return null

  const payload = token.slice(0, idx)
  const provided = token.slice(idx + 1)
  const expected = sign(payload)

  // 长度不等时 timingSafeEqual 会抛错，先比长度
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!crypto.timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null
    if (typeof data.u !== 'string') return null
    return data.u
  } catch {
    return null
  }
}

/** 校验用户名密码，成功则写入会话 Cookie */
export async function login(
  username: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb()
  const row = db
    .prepare('SELECT username, password_hash FROM users WHERE username = ?')
    .get(username) as { username: string; password_hash: string } | undefined

  // 用户不存在时也执行一次哈希比较，避免通过响应时间探测用户名是否存在
  const hash =
    row?.password_hash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
  const match = bcrypt.compareSync(password, hash)

  if (!row || !match) {
    return { ok: false, error: '用户名或密码错误' }
  }

  const store = await cookies()
  store.set(COOKIE_NAME, createToken(row.username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
  return { ok: true }
}

/** 退出登录，清除会话 Cookie */
export async function logout(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/** 当前登录的管理员用户名；未登录返回 null */
export async function getCurrentUser(): Promise<string | null> {
  const store = await cookies()
  return verifyToken(store.get(COOKIE_NAME)?.value)
}

/** 是否已登录 */
export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null
}
