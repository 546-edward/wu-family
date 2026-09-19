import Link from 'next/link'
import { requireAuth } from '@/lib/guard'
import { listAnnouncements } from '@/lib/queries'

/**
 * 后台概览：公告与附件的基本统计，附快捷入口。
 */
export default async function AdminHomePage() {
  await requireAuth()

  const announcements = listAnnouncements()

  const pinned = announcements.filter((a) => a.isPinned).length
  const attachmentCount = announcements.reduce(
    (sum, a) => sum + (a.attachments?.length ?? 0),
    0
  )
  const latest = announcements[0]

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-title mb-4 text-xl tracking-wider text-brand-primary">
          概览
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="公告总数" value={String(announcements.length)} />
          <Stat label="其中置顶" value={String(pinned)} />
          <Stat label="附件总数" value={String(attachmentCount)} />
        </div>
      </section>

      <section>
        <h2 className="font-title mb-4 text-xl tracking-wider text-brand-primary">
          快捷操作
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/announcements/new"
            className="rounded-sm bg-brand-primary px-4 py-2.5 text-[15px] text-white transition-opacity hover:opacity-90"
          >
            发布新公告
          </Link>
          <Link
            href="/admin/announcements"
            className="rounded-sm border border-brand-accent/40 px-4 py-2.5 text-[15px] text-brand-ink/80 transition-colors hover:border-brand-primary hover:text-brand-primary"
          >
            管理公告与附件
          </Link>
        </div>
        <p className="mt-3 text-sm text-brand-ink/55">
          发布公告时可一并上传附件（文档、表格、图片等）。
        </p>
      </section>

      {latest && (
        <section>
          <h2 className="font-title mb-4 text-xl tracking-wider text-brand-primary">
            最近一条公告
          </h2>
          <div className="card-cn rounded-sm p-5">
            <p className="text-[15px] font-medium">
              {latest.isPinned && (
                <span className="seal-tag mr-2 rounded-sm px-1.5 py-0.5 text-xs">
                  置顶
                </span>
              )}
              {latest.title}
            </p>
            <p className="mt-1.5 text-sm text-brand-ink/50">
              {latest.authorName} · {latest.publishedAt}
              {latest.attachments && latest.attachments.length > 0
                ? ` · ${latest.attachments.length} 个附件`
                : ''}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-cn rounded-sm px-5 py-4">
      <p className="text-xs tracking-widest text-brand-ink/50">{label}</p>
      <p className="font-title mt-1.5 text-3xl tracking-wider text-brand-ink">
        {value}
      </p>
    </div>
  )
}
