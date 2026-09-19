'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import type { Announcement } from '@/types'
import {
  ACCEPT_ATTR,
  ALLOWED_LABEL,
  MAX_ATTACHMENTS,
  MAX_FILE_BYTES,
  formatSize,
} from '@/lib/attachments-shared'
import { saveAnnouncementAction, deleteAttachmentAction, type AnnouncementFormState } from './actions'

const initialState: AnnouncementFormState = { error: null }

/**
 * 公告表单，新建与编辑共用。
 *
 * 附件处理：
 * - 新建：选择文件后随公告一起提交
 * - 编辑：已有附件单独删除；新选文件追加
 *
 * 文件不在此处做最终校验（仅在界面上做即时提示），
 * 真正的类型与大小校验在服务端 actions.ts 中进行。
 */
export default function AnnouncementForm({
  announcement,
}: {
  announcement?: Announcement
}) {
  const [state, formAction, pending] = useActionState(
    saveAnnouncementAction,
    initialState
  )
  const [picked, setPicked] = useState<File[]>([])
  const isEdit = Boolean(announcement)
  const today = new Date().toISOString().slice(0, 10)

  const existing = announcement?.attachments ?? []
  /** 客户端即时提示：仅作提醒，服务端仍会严格校验 */
  const oversize = picked.filter((f) => f.size > MAX_FILE_BYTES)
  const tooMany = picked.length > MAX_ATTACHMENTS

  return (
    <form action={formAction} className="card-cn space-y-5 rounded-sm p-6 md:p-7">
      {isEdit && <input type="hidden" name="id" value={announcement!.id} />}

      <Field label="标题" error={state.fieldErrors?.title}>
        <input
          name="title"
          type="text"
          required
          defaultValue={announcement?.title ?? ''}
          maxLength={120}
          className={inputCls}
        />
      </Field>

      <Field label="正文" error={state.fieldErrors?.content}>
        <textarea
          name="content"
          required
          rows={10}
          defaultValue={announcement?.content ?? ''}
          className={inputCls + ' resize-y leading-7'}
        />
        <p className="mt-1.5 text-xs text-brand-ink/45">
          支持换行，前台按原样分段展示。
        </p>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="署名" error={state.fieldErrors?.authorName}>
          <input
            name="authorName"
            type="text"
            required
            defaultValue={announcement?.authorName ?? ''}
            className={inputCls}
          />
        </Field>

        <Field label="发布日期" error={state.fieldErrors?.publishedAt}>
          <input
            name="publishedAt"
            type="date"
            required
            defaultValue={announcement?.publishedAt ?? today}
            className={inputCls}
          />
        </Field>
      </div>

      {/* ------------------------------ 附件 ------------------------------ */}
      <div>
        <span className="mb-1.5 block text-sm text-brand-ink/70">
          附件（可选，最多 {MAX_ATTACHMENTS} 个，单个不超过{' '}
          {MAX_FILE_BYTES / 1024 / 1024}MB）
        </span>

        {/* 已有附件：编辑时展示，可单独删除 */}
        {existing.length > 0 && (
          <div className="mb-3">
            <p className="mb-2 text-xs text-brand-ink/50">
              已有附件（删除后即时生效，不需点保存）
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {existing.map((a) => (
                <li
                  key={a.id}
                  className="card-cn flex items-center gap-3 rounded-sm p-3"
                >
                  <span
                    aria-hidden
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-brand-accent/30 bg-brand-accent/5 text-[10px] font-medium tracking-tight text-brand-accent"
                  >
                    {fileBadge(a.fileName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/api/attachments/${encodeURIComponent(a.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-brand-primary underline-offset-4 hover:underline"
                      title={a.fileName}
                    >
                      {a.fileName}
                    </a>
                    <p className="mt-0.5 text-xs text-brand-ink/45">
                      {formatSize(a.sizeBytes)}
                    </p>
                  </div>
                  {/* 用 formAction 覆盖外层表单的提交目标；
                      不能嵌套 form，故用同一表单内的不同 action。

                      两个坑：
                      1) 必须加 formNoValidate，否则外层表单的 required 字段
                         未填时浏览器会阻止提交，删除按钮点不动
                      2) **不能用 name 传递参数** —— Next.js 会把 Server Action
                         的 ID 写到按钮的 name 属性上，直接覆盖业务参数。
                         所以用同名 hidden input 传 attachmentId。 */}
                  <input type="hidden" name="attachmentId" value={a.id} />
                  <button
                    type="submit"
                    formAction={deleteAttachmentAction}
                    formNoValidate
                    className="shrink-0 rounded-sm border border-brand-primary/40 px-2.5 py-1 text-xs text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/*
          自定义上传按钮：原生的 <input type=file> 在不同浏览器里外观不一，
          且默认按钮文案是「选择文件」，与「添加附件」不一致，也不明显可点。
          这里用 <label> 包裹隐藏的 input，做成一个醒目的按钮，
          点击 label 即可唤起文件选择器（原生行为，无需 JS）。
        */}
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="attachments"
            className="cursor-pointer rounded-sm border border-brand-primary/45 bg-brand-primary px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            + 添加附件
          </label>
          <span className="text-xs text-brand-ink/50">
            {picked.length > 0
              ? `已选择 ${picked.length} 个文件`
              : '尚未选择文件'}
          </span>

          <input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            onChange={(e) => setPicked(Array.from(e.target.files ?? []))}
            className="sr-only"
          />
        </div>
        <p className="mt-1.5 text-xs text-brand-ink/45">
          支持 {ALLOWED_LABEL}。图片附件在前台可直接预览，其余格式点击下载。
        </p>

        {/* 本次待上传的文件列表 */}
        {picked.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {picked.map((f) => (
              <li
                key={`${f.name}-${f.size}`}
                className="flex items-center justify-between gap-3 rounded-sm border border-brand-accent/25 bg-white/50 px-3 py-2 text-sm"
              >
                <span className="truncate text-brand-ink/80">{f.name}</span>
                <span className="shrink-0 text-xs text-brand-ink/50">
                  {formatSize(f.size)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* 选错了可清空重选（仅清空待上传列表，不影响已保存的附件） */}
        {picked.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setPicked([])
              const el = document.getElementById(
                'attachments'
              ) as HTMLInputElement | null
              if (el) el.value = ''
            }}
            className="mt-2 text-xs text-brand-ink/55 underline-offset-4 hover:text-brand-primary hover:underline"
          >
            清空已选
          </button>
        )}

        {oversize.length > 0 && (
          <p className="mt-2 text-sm text-brand-primary">
            以下文件超过大小限制，提交时会被拒绝：
            {oversize.map((f) => f.name).join('、')}
          </p>
        )}
        {tooMany && (
          <p className="mt-2 text-sm text-brand-primary">
            一次最多上传 {MAX_ATTACHMENTS} 个附件
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-brand-ink/80">
        <input
          name="isPinned"
          type="checkbox"
          defaultChecked={announcement?.isPinned ?? false}
          className="h-4 w-4 accent-[var(--theme-primary)]"
        />
        置顶显示（前台排在列表最前）
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-brand-primary/40 bg-brand-primary/5 px-3 py-2.5 text-sm text-brand-primary"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-brand-accent/20 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-brand-primary px-5 py-2.5 text-[15px] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? '保存中…' : isEdit ? '保存修改' : '发布公告'}
        </button>
        <Link
          href="/admin/announcements"
          className="rounded-sm border border-brand-accent/40 px-5 py-2.5 text-[15px] text-brand-ink/75 transition-colors hover:border-brand-primary hover:text-brand-primary"
        >
          取消
        </Link>
      </div>
    </form>
  )
}

const inputCls =
  'w-full rounded-sm border border-brand-accent/35 bg-white/80 px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-brand-primary'

/** 从文件名取出扩展名作为角标文字 */
function fileBadge(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0 || dot === fileName.length - 1) return '文件'
  return fileName.slice(dot + 1).toUpperCase().slice(0, 5)
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm text-brand-ink/70">{label}</span>
      {children}
      {error && <p className="mt-1.5 text-sm text-brand-primary">{error}</p>}
    </div>
  )
}
