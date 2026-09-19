'use server'

import fs from 'node:fs/promises'
import path from 'node:path'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/guard'
import { UPLOAD_DIR } from '@/lib/db'
import { createUpload, deleteUpload } from '@/lib/queries'
import { parseWorkbook, validateFile } from '@/lib/excel'

export interface UploadState {
  error: string | null
}

/** 生成随机文件名，避免覆盖与路径穿越 */
function safeStoredName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.xlsx'
  const rand = Array.from({ length: 16 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')
  return `${Date.now().toString(36)}-${rand}${ext}`
}

/**
 * 上传并解析 Excel（Server Action）。
 *
 * 处理顺序：校验登录 → 校验文件 → 解析 → 落库 → 保存原件。
 * 先解析再保存，确保格式错误的文件不会在磁盘留下垃圾。
 */
export async function uploadExcelAction(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  await requireAuth()

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { error: '请选择要上传的文件' }
  }

  const title = String(formData.get('title') ?? '').trim()

  const check = validateFile({ name: file.name, size: file.size })
  if (!check.ok) return { error: check.error }

  let parsed
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    parsed = await parseWorkbook(buffer)
  } catch (err) {
    const msg = err instanceof Error ? err.message : '解析失败'
    return { error: `无法解析该文件：${msg}` }
  }

  const id = `x-${Date.now().toString(36)}`
  const storedName = safeStoredName(file.name)

  try {
    // 落库（含行数据，事务）
    createUpload({
      id,
      title: title || file.name.replace(/\.xlsx$/i, ''),
      fileName: file.name,
      storedName,
      sheetName: parsed.sheetName,
      columns: parsed.columns,
      rows: parsed.rows,
      sizeBytes: file.size,
    })

    // 保存原件到非公开目录
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(path.join(UPLOAD_DIR, storedName), buffer)
  } catch (err) {
    // 落库失败则清理可能已写入的原件
    await fs.unlink(path.join(UPLOAD_DIR, storedName)).catch(() => {})
    const msg = err instanceof Error ? err.message : '未知错误'
    return { error: `保存失败：${msg}` }
  }

  revalidatePath('/admin/excel')
  redirect(`/admin/excel/${id}`)
}

/** 删除上传记录及其原件 */
export async function deleteUploadAction(formData: FormData): Promise<void> {
  await requireAuth()

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const storedName = deleteUpload(id)
  if (storedName) {
    // 路径拼接后再校验，确保删除目标始终在 UPLOAD_DIR 之内
    const target = path.resolve(UPLOAD_DIR, storedName)
    if (target.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
      await fs.unlink(target).catch(() => {})
    }
  }

  revalidatePath('/admin/excel')
}
