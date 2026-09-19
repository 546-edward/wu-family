import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/guard'
import { getUploadPage } from '@/lib/queries'
import SheetTable from '../SheetTable'

export const metadata = { title: '表格查看' }

/** 每页行数 */
const PAGE_SIZE = 20

/**
 * Excel 表格详情：分页 + 行展开展示。
 * 页码来自 URL 查询参数 `?page=N`，非法值由 getUploadPage 归一化。
 */
export default async function UploadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  await requireAuth()

  const { id } = await params
  const { page } = await searchParams

  const parsedPage = Number.parseInt(page ?? '1', 10)
  const data = getUploadPage(
    decodeURIComponent(id),
    Number.isFinite(parsedPage) ? parsedPage : 1,
    PAGE_SIZE
  )
  if (!data) notFound()

  const { upload } = data

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/excel"
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          ← 返回 Excel 列表
        </Link>
        <h2 className="font-title mt-3 text-xl tracking-wider text-brand-primary">
          {upload.title}
        </h2>
        <p className="mt-1.5 text-sm text-brand-ink/55">
          {upload.fileName} · 工作表「{upload.sheetName}」· {upload.colCount} 列
        </p>
      </div>

      <SheetTable data={data} />
    </div>
  )
}
