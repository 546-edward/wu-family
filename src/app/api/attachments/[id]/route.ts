import fs from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { UPLOAD_DIR } from '@/lib/db'
import { getAttachment } from '@/lib/queries'
import { isImage } from '@/lib/attachments-shared'

/**
 * 附件下载 / 图片预览。
 *
 * 为什么需要这个路由：
 * 附件存放在 `data/uploads/`，该目录**不在 public/ 下**，
 * 无法被静态服务直接访问。这是刻意的设计 —— 文件必须经此接口
 * 校验存在性后才读取，避免目录被枚举。
 *
 * 安全要点：
 * - 只按数据库记录中的 `stored_name` 读文件，不使用任何用户传入的路径
 * - 再次校验最终路径落在 UPLOAD_DIR 内，防路径穿越
 * - 设置 `X-Content-Type-Options: nosniff`，避免浏览器嗅探内容类型
 * - 对可执行/可嵌入的类型（如 html、svg）已在上传白名单中排除；
 *   非图片一律以 attachment 下载，不在浏览器内联渲染
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const attachment = getAttachment(decodeURIComponent(id))
  if (!attachment) {
    return new NextResponse('附件不存在', { status: 404 })
  }

  const target = path.resolve(UPLOAD_DIR, attachment.storedName)
  // 双保险：即使数据库被污染，也不允许读到 UPLOAD_DIR 之外
  if (!target.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return new NextResponse('非法路径', { status: 400 })
  }

  let data: Buffer
  try {
    data = await fs.readFile(target)
  } catch {
    return new NextResponse('文件已丢失', { status: 404 })
  }

  const image = isImage(attachment.mimeType)

  // 中文文件名需按 RFC 5987 编码，否则下载后文件名会乱码
  const encodedName = encodeURIComponent(attachment.fileName)
  const disposition = image ? 'inline' : 'attachment'

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Length': String(data.length),
      'Content-Disposition': `${disposition}; filename*=UTF-8''${encodedName}`,
      'X-Content-Type-Options': 'nosniff',
      // 附件内容不常变，允许短缓存
      'Cache-Control': 'private, max-age=300',
    },
  })
}
