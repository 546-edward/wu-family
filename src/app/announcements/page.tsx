import type { Metadata } from 'next'
import { getAnnouncements } from '@/lib/data'

export const metadata: Metadata = {
  title: '公告',
  description: '家族公告与通知，按发布时间倒序排列，置顶公告优先展示。',
}

/**
 * 公告页：置顶优先，其余按发布时间倒序（排序在 data.ts 完成）。
 * 第一版不做详情页跳转，内容全文展开。
 */
export default function AnnouncementsPage() {
  const announcements = getAnnouncements()

  return (
    <div className="space-y-8">
      <header className="border-b border-brand-primary/20 pb-5">
        <h1 className="font-title text-3xl tracking-[0.2em] text-brand-primary md:text-4xl">
          公告
        </h1>
        <p className="mt-2 text-[15px] text-brand-ink/65">
          共 {announcements.length} 条，置顶公告优先展示。
        </p>
      </header>

      {announcements.length === 0 ? (
        <p className="text-brand-ink/50">暂无公告。</p>
      ) : (
        <ul className="space-y-6">
          {announcements.map((a) => (
            <li key={a.id}>
              <article
                className={
                  'rounded-sm border bg-white/40 p-6 md:p-7 ' +
                  (a.isPinned
                    ? 'border-brand-primary/45 shadow-sm'
                    : 'border-brand-primary/20')
                }
              >
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {a.isPinned && (
                    <span className="rounded-sm bg-brand-primary px-2 py-0.5 text-xs text-brand-paper">
                      置顶
                    </span>
                  )}
                  <h2 className="font-title text-xl tracking-wider text-brand-ink md:text-2xl">
                    {a.title}
                  </h2>
                </header>

                <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-brand-ink/50">
                  <span>{a.authorName}</span>
                  <time dateTime={a.publishedAt} className="tabular-nums">
                    {a.publishedAt}
                  </time>
                </p>

                <div className="whitespace-pre-wrap-cn mt-4 border-t border-brand-primary/15 pt-4 text-[15px] leading-8 text-brand-ink/80">
                  {a.content}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
