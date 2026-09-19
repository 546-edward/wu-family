import Link from 'next/link'
import { requireAuth } from '@/lib/guard'
import { listUploads } from '@/lib/queries'
import { deleteUploadAction } from './actions'
import UploadForm from './UploadForm'

export const metadata = { title: 'Excel 管理' }

/** Excel 管理：上传表单 + 已上传表格列表 */
export default async function AdminExcelPage() {
  await requireAuth()
  const uploads = listUploads()

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-title mb-4 text-xl tracking-wider text-brand-primary">
          上传 Excel
        </h2>
        <UploadForm />
      </section>

      <section>
        <h2 className="font-title mb-4 text-xl tracking-wider text-brand-primary">
          已上传表格（{uploads.length}）
        </h2>

        {uploads.length === 0 ? (
          <p className="text-brand-ink/55">还没有上传任何表格。</p>
        ) : (
          <ul className="space-y-3">
            {uploads.map((u) => (
              <li key={u.id} className="card-cn rounded-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/excel/${u.id}`}
                      className="text-[15px] font-medium text-brand-ink hover:text-brand-primary"
                    >
                      {u.title}
                    </Link>
                    <p className="mt-1.5 text-sm text-brand-ink/50">
                      {u.fileName} · 工作表「{u.sheetName}」· {u.rowCount} 行 ×{' '}
                      {u.colCount} 列 · {formatSize(u.sizeBytes)}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-ink/40">
                      上传于 {u.uploadedAt}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/admin/excel/${u.id}`}
                      className="rounded-sm border border-brand-accent/40 px-3 py-1.5 text-sm text-brand-ink/75 transition-colors hover:border-brand-primary hover:text-brand-primary"
                    >
                      查看表格
                    </Link>
                    <form action={deleteUploadAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="rounded-sm border border-brand-primary/40 px-3 py-1.5 text-sm text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
