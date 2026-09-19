import Link from 'next/link'
import { requireAuth } from '@/lib/guard'
import { listAnnouncements } from '@/lib/queries'
import { deleteAnnouncementAction, togglePinAction } from './actions'

export const metadata = { title: '公告管理' }

/** 公告管理：列表 + 置顶切换 + 删除 + 编辑入口 */
export default async function AdminAnnouncementsPage() {
  await requireAuth()
  const announcements = listAnnouncements()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-title text-xl tracking-wider text-brand-primary">
          公告管理
        </h2>
        <Link
          href="/admin/announcements/new"
          className="rounded-sm bg-brand-primary px-4 py-2 text-[15px] text-white transition-opacity hover:opacity-90"
        >
          新建公告
        </Link>
      </div>

      {announcements.length === 0 ? (
        <p className="text-brand-ink/55">暂无公告，点击右上角新建。</p>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="card-cn rounded-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">
                    {a.isPinned && (
                      <span className="seal-tag mr-2 rounded-sm px-1.5 py-0.5 text-xs">
                        置顶
                      </span>
                    )}
                    {a.title}
                  </p>
                  <p className="mt-1.5 text-sm text-brand-ink/50">
                    {a.authorName} · {a.publishedAt} · 编号 {a.id}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-brand-ink/65">
                    {a.content}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/admin/announcements/${encodeURIComponent(a.id)}`}
                    className="rounded-sm border border-brand-accent/40 px-3 py-1.5 text-sm text-brand-ink/75 transition-colors hover:border-brand-primary hover:text-brand-primary"
                  >
                    编辑
                  </Link>

                  <form action={togglePinAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-sm border border-brand-accent/40 px-3 py-1.5 text-sm text-brand-ink/75 transition-colors hover:border-brand-primary hover:text-brand-primary"
                    >
                      {a.isPinned ? '取消置顶' : '置顶'}
                    </button>
                  </form>

                  <form action={deleteAnnouncementAction}>
                    <input type="hidden" name="id" value={a.id} />
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
    </div>
  )
}
