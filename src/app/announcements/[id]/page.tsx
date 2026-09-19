import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAnnouncement, getAnnouncements } from '@/lib/data'
import { formatSize, isImage } from '@/lib/attachments-shared'

/** 公告实时来自数据库，详情页同样需要动态渲染 */
export const dynamic = 'force-dynamic'

/** 详情页标题用公告标题，便于分享与浏览器标签识别 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const announcement = getAnnouncement(decodeURIComponent(id))
  if (!announcement) return { title: '公告不存在' }

  return {
    title: announcement.title,
    description: announcement.content.replace(/\s+/g, ' ').slice(0, 120),
  }
}

/**
 * 公告详情页 `/announcements/[id]`。
 *
 * 正文全文在此展示；列表页只给摘要。
 * 底部附同列表顺序的「上一条 / 下一条」，便于连续阅读。
 */
export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const decoded = decodeURIComponent(id)

  const announcement = getAnnouncement(decoded)
  if (!announcement) notFound()

  // 用完整列表计算前后篇，保证顺序与列表页一致（置顶优先 + 时间倒序）
  const all = getAnnouncements()
  const index = all.findIndex((a) => a.id === decoded)
  const prev = index > 0 ? all[index - 1] : null
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/announcements"
        className="text-sm text-brand-primary underline-offset-4 hover:underline"
      >
        ← 返回公告列表
      </Link>

      <header className="mt-5 border-b border-brand-primary/20 pb-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {announcement.isPinned && (
            <span className="seal-tag rounded-sm px-2 py-0.5 text-xs">置顶</span>
          )}
          <h1 className="font-title text-2xl leading-snug tracking-wider text-brand-primary md:text-4xl">
            {announcement.title}
          </h1>
        </div>

        <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-brand-ink/55">
          <span>{announcement.authorName}</span>
          <time dateTime={announcement.publishedAt} className="tabular-nums">
            {announcement.publishedAt}
          </time>
        </p>
      </header>

      <hr className="rule-festive my-6" />

      {/* 正文：保留原有换行 */}
      <div className="whitespace-pre-wrap-cn text-[15px] leading-9 text-brand-ink/85 md:text-base">
        {announcement.content}
      </div>

      {/* 附件：图片直接嵌入展示，其余提供下载 */}
      {announcement.attachments && announcement.attachments.length > 0 && (
        <section className="mt-10">
          <h2 className="font-title mb-4 border-b border-brand-accent/25 pb-2 text-lg tracking-wider text-brand-primary">
            附件（{announcement.attachments.length}）
          </h2>

          {/* 图片附件：大图直接展示 */}
          <div className="space-y-4">
            {announcement.attachments
              .filter((a) => isImage(a.mimeType))
              .map((a) => (
                <figure key={a.id}>
                  <a
                    href={`/api/attachments/${encodeURIComponent(a.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/attachments/${encodeURIComponent(a.id)}`}
                      alt={a.fileName}
                      className="max-h-[32rem] w-auto max-w-full rounded-sm border border-brand-accent/30"
                    />
                  </a>
                  <figcaption className="mt-2 text-xs text-brand-ink/50">
                    {a.fileName} · {formatSize(a.sizeBytes)}
                  </figcaption>
                </figure>
              ))}
          </div>

          {/* 非图片附件：下载列表 */}
          {announcement.attachments.some((a) => !isImage(a.mimeType)) && (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {announcement.attachments
                .filter((a) => !isImage(a.mimeType))
                .map((a) => (
                  <li
                    key={a.id}
                    className="card-cn flex items-center gap-3 rounded-sm p-3"
                  >
                    <span
                      aria-hidden
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-brand-accent/30 bg-brand-accent/5 text-[10px] font-medium text-brand-accent"
                    >
                      {fileBadge(a.fileName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={`/api/attachments/${encodeURIComponent(a.id)}`}
                        className="block truncate text-sm text-brand-primary underline-offset-4 hover:underline"
                        title={a.fileName}
                      >
                        {a.fileName}
                      </a>
                      <p className="mt-0.5 text-xs text-brand-ink/45">
                        {formatSize(a.sizeBytes)} · 点击下载
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}

      <footer className="mt-10 border-t border-brand-accent/25 pt-6">
        <nav
          aria-label="上下篇导航"
          className="flex flex-col gap-3 sm:flex-row sm:justify-between"
        >
          {prev ? (
            <Link
              href={`/announcements/${encodeURIComponent(prev.id)}`}
              className="group max-w-full sm:max-w-[48%]"
            >
              <span className="text-xs text-brand-ink/45">上一条</span>
              <span className="block truncate text-[15px] text-brand-primary transition-colors group-hover:underline">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}

          {next && (
            <Link
              href={`/announcements/${encodeURIComponent(next.id)}`}
              className="group max-w-full text-left sm:max-w-[48%] sm:text-right"
            >
              <span className="text-xs text-brand-ink/45">下一条</span>
              <span className="block truncate text-[15px] text-brand-primary transition-colors group-hover:underline">
                {next.title}
              </span>
            </Link>
          )}
        </nav>

        <div className="mt-6">
          <Link
            href="/announcements"
            className="inline-block rounded-sm border border-brand-accent/40 px-4 py-2 text-sm text-brand-ink/75 transition-colors hover:border-brand-primary hover:text-brand-primary"
          >
            查看全部公告
          </Link>
        </div>
      </footer>
    </article>
  )
}

/** 从文件名取出扩展名作为角标文字 */
function fileBadge(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0 || dot === fileName.length - 1) return '文件'
  return fileName.slice(dot + 1).toUpperCase().slice(0, 5)
}
