'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { Announcement } from '@/types'
import { saveAnnouncementAction, type AnnouncementFormState } from './actions'

const initialState: AnnouncementFormState = { error: null }

/**
 * 公告表单，新建与编辑共用。
 * `announcement` 为空表示新建。
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
  const isEdit = Boolean(announcement)
  const today = new Date().toISOString().slice(0, 10)

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
