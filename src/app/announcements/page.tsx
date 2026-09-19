import type { Metadata } from 'next'
import Link from 'next/link'
import { getAnnouncements } from '@/lib/data'

/**
 * 公告数据来自数据库（后台可发布），因此本页必须动态渲染：
 * 若静态预渲染，后台新发布的公告要等重新构建才会出现在前台。
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '公告',
  description: '家族公告与通知，按发布时间倒序排列，置顶公告优先展示。',
}

/**
 * 公告列表页：置顶优先，其余按发布时间倒序（排序在 queries.ts 的 SQL 中完成）。
 *
 * 本页只展示摘要，点击标题或「阅读全文」进入 `/announcements/[id]` 查看详情。
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
          共 {announcements.length} 条，置顶公告优先展示。点击标题查看详情。
        </p>
      </header>
      <hr className="rule-festive -mt-4" />

      {announcements.length === 0 ? (
        <p className="text-brand-ink/50">暂无公告。</p>
      ) : (
        <ul className="space-y-5">
          {announcements.map((a) => (
            <li key={a.id}>
              <article
                className={
                  'card-cn card-cn-hover rounded-sm p-6 md:p-7 ' +
                  (a.isPinned ? 'border-brand-primary/45 shadow-sm' : '')
                }
              >
                <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                  {a.isPinned && (
                    <span className="seal-tag rounded-sm px-2 py-0.5 text-xs">
                      置顶
                    </span>
                  )}
                  {/* 标题整体可点击，扩大点击热区 */}
                  <h2 className="font-title text-xl tracking-wider md:text-2xl">
                    <Link
                      href={`/announcements/${encodeURIComponent(a.id)}`}
                      className="text-brand-ink transition-colors hover:text-brand-primary"
                    >
                      {a.title}
                    </Link>
                  </h2>
                </header>

                <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-brand-ink/50">
                  <span>{a.authorName}</span>
                  <time dateTime={a.publishedAt} className="tabular-nums">
                    {a.publishedAt}
                  </time>
                </p>

                {/* 摘要：截取正文前若干字，不直接展开全文 */}
                <p className="mt-3 line-clamp-3 text-[15px] leading-8 text-brand-ink/70">
                  {summarize(a.content)}
                </p>

                <div className="mt-4 border-t border-brand-accent/25 pt-3.5">
                  <Link
                    href={`/announcements/${encodeURIComponent(a.id)}`}
                    className="text-sm text-brand-primary underline-offset-4 hover:underline"
                  >
                    阅读全文 →
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 摘要：取正文前 140 字，超出加省略号；同时把换行压成空格 */
function summarize(content: string, max = 140): string {
  const flat = content.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max)}……` : flat
}
