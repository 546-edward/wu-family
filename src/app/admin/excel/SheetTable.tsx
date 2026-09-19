'use client'

import { Fragment, useState } from 'react'
import type { UploadPage } from '@/types'

/**
 * Excel 表格展示：分页 + 行展开。
 *
 * 分页在服务端完成（见 queries.getUploadPage），此处只负责渲染与
 * 通过 URL 跳转翻页，不把整表数据加载到浏览器。
 *
 * 行展开：点击某行展开后，以「字段 — 值」逐条列出，
 * 便于查看长文本列而不必横向滚动。
 */
export default function SheetTable({ data }: { data: UploadPage }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const { upload, rows, page, pageSize, totalRows, totalPages } = data

  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalRows)

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-ink/55">
        共 {totalRows} 行，当前显示第 {from}–{to} 行（每页 {pageSize} 行）
      </p>

      <div className="card-cn overflow-x-auto rounded-sm">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-accent/30 bg-brand-accent/5">
              <th className="w-14 px-3 py-3 text-left font-medium text-brand-ink/60">
                #
              </th>
              {upload.columns.map((col, i) => (
                <th
                  key={i}
                  className="whitespace-nowrap px-3 py-3 text-left font-medium text-brand-ink/85"
                >
                  {col}
                </th>
              ))}
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isOpen = expanded === row.rowIndex
              return (
                <Fragment key={row.rowIndex}>
                  <tr
                    className={
                      'border-b border-brand-accent/15 transition-colors ' +
                      (isOpen ? 'bg-brand-accent/5' : 'hover:bg-brand-accent/5')
                    }
                  >
                    <td className="px-3 py-2.5 text-brand-ink/45 tabular-nums">
                      {row.rowIndex}
                    </td>
                    {row.cells.map((cell, i) => (
                      <td
                        key={i}
                        className="max-w-[22rem] truncate px-3 py-2.5 text-brand-ink/80"
                        title={cell}
                      >
                        {cell || <span className="text-brand-ink/25">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : row.rowIndex)}
                        aria-expanded={isOpen}
                        className="rounded-sm border border-brand-accent/40 px-2.5 py-1 text-xs text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
                      >
                        {isOpen ? '收起' : '展开'}
                      </button>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr
                      className="border-b border-brand-accent/15 bg-brand-accent/5"
                    >
                      <td colSpan={upload.columns.length + 2} className="px-3 py-4">
                        <dl className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">
                          {upload.columns.map((col, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                              <dt className="w-32 shrink-0 text-brand-ink/50">
                                {col}
                              </dt>
                              <dd className="whitespace-pre-wrap break-words text-brand-ink/85">
                                {row.cells[i] || (
                                  <span className="text-brand-ink/25">—</span>
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination id={upload.id} page={page} totalPages={totalPages} />
    </div>
  )
}

/** 分页控件：通过 URL 查询参数翻页，便于分享与刷新保持位置 */
function Pagination({
  id,
  page,
  totalPages,
}: {
  id: string
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  // 最多显示 7 个页码，中间省略
  const pages: (number | '…')[] = []
  const push = (n: number | '…') => pages.push(n)
  const window = 1
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - window && i <= page + window)
    ) {
      push(i)
    } else if (pages[pages.length - 1] !== '…') {
      push('…')
    }
  }

  const href = (p: number) =>
    `/admin/excel/${encodeURIComponent(id)}?page=${p}`

  return (
    <nav
      aria-label="分页"
      className="flex flex-wrap items-center justify-center gap-1.5 pt-2"
    >
      {page > 1 && (
        <a href={href(page - 1)} className={btnCls}>
          上一页
        </a>
      )}

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-brand-ink/40">
            …
          </span>
        ) : (
          <a
            key={p}
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={p === page ? btnActiveCls : btnCls}
          >
            {p}
          </a>
        )
      )}

      {page < totalPages && (
        <a href={href(page + 1)} className={btnCls}>
          下一页
        </a>
      )}
    </nav>
  )
}

const btnCls =
  'inline-block rounded-sm border border-brand-accent/40 px-3 py-1.5 text-sm text-brand-ink/75 transition-colors hover:border-brand-primary hover:text-brand-primary'
const btnActiveCls =
  'inline-block rounded-sm border border-brand-primary bg-brand-primary px-3 py-1.5 text-sm text-white'
