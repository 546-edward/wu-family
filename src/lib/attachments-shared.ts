/**
 * 附件相关的**共享**工具：客户端与服务端都能安全引用。
 *
 * 为什么单独一个文件：`src/lib/attachments.ts` 标注了 `server-only`
 * （含文件系统与安全校验逻辑），客户端组件无法引用它。
 * 这里只放纯函数与常量，不涉及 Node API。
 */

/** 单文件大小上限：20MB */
export const MAX_FILE_BYTES = 20 * 1024 * 1024

/** 单条公告最多附件数 */
export const MAX_ATTACHMENTS = 10

/**
 * 允许的扩展名 → MIME 类型。
 *
 * **刻意不包含** .html / .svg / .js 等可在浏览器中执行或嵌入脚本的格式，
 * 避免上传后被当作网页渲染造成 XSS。
 */
export const ALLOWED_TYPES: Record<string, string> = {
  // 文档
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',
  // 表格
  '.xls': 'application/vnd.ms-excel',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  // 演示
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 图片
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  // 压缩包
  '.zip': 'application/zip',
}

/** 供 `<input accept>` 使用 */
export const ACCEPT_ATTR = Object.keys(ALLOWED_TYPES).join(',')

/** 供界面展示的格式说明 */
export const ALLOWED_LABEL =
  'doc、docx、pdf、txt、xls、xlsx、csv、ppt、pptx、jpg、png、gif、webp、zip'

/** 人类可读的文件大小 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** 是否为图片附件（决定内联预览还是下载） */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}
