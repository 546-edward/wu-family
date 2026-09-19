import 'server-only'
import path from 'node:path'
import {
  ALLOWED_TYPES,
  MAX_ATTACHMENTS,
  MAX_FILE_BYTES,
} from '@/lib/attachments-shared'

/**
 * 附件上传的**服务端**校验逻辑。
 *
 * 类型白名单与大小上限定义在 `attachments-shared.ts`（客户端也要用），
 * 本文件只负责服务端特有的校验与文件命名。
 *
 * 安全原则：
 * - 使用**白名单**扩展名，而非黑名单。未列出的格式一律拒绝，
 *   避免遗漏可执行文件（.exe/.sh/.js/.html 等）
 * - 存储文件名随机生成，不使用用户提供的名字：
 *   既避免覆盖，也避免路径穿越（如 `../../etc/passwd`）
 * - 附件存放在非公开目录 `data/uploads/`，**不经静态服务直接暴露**；
 *   下载一律经 `/api/attachments/[id]` 校验存在性后读取
 */

export { MAX_ATTACHMENTS, MAX_FILE_BYTES }

/** 校验单个文件是否允许上传 */
export function validateAttachment(file: {
  name: string
  size: number
}): { ok: true; mimeType: string; ext: string } | { ok: false; error: string } {
  const ext = path.extname(file.name).toLowerCase()

  if (!ext) {
    return { ok: false, error: `「${file.name}」没有扩展名，无法判断文件类型` }
  }

  const mimeType = ALLOWED_TYPES[ext]
  if (!mimeType) {
    return {
      ok: false,
      error: `「${file.name}」的格式 ${ext} 不在允许范围内`,
    }
  }
  if (file.size === 0) {
    return { ok: false, error: `「${file.name}」是空文件` }
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `「${file.name}」超过 ${MAX_FILE_BYTES / 1024 / 1024}MB 上限`,
    }
  }

  return { ok: true, mimeType, ext }
}

/** 生成随机存储文件名：保留扩展名，主体随机，避免覆盖与路径穿越 */
export function randomStoredName(ext: string): string {
  const rand = Array.from({ length: 24 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')
  return `${Date.now().toString(36)}-${rand}${ext}`
}
