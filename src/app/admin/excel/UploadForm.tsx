'use client'

import { useActionState, useRef } from 'react'
import { uploadExcelAction, type UploadState } from './actions'

const initialState: UploadState = { error: null }

/** Excel 上传表单。文件类型与大小在服务端二次校验，此处仅作提示。 */
export default function UploadForm() {
  const [state, formAction, pending] = useActionState(
    uploadExcelAction,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      action={formAction}
      className="card-cn space-y-5 rounded-sm p-6"
    >
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm text-brand-ink/70">
          表格名称（可选，留空则用文件名）
        </label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={80}
          className="w-full rounded-sm border border-brand-accent/35 bg-white/80 px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-brand-primary"
        />
      </div>

      <div>
        <label htmlFor="file" className="mb-1.5 block text-sm text-brand-ink/70">
          选择文件
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="w-full cursor-pointer rounded-sm border border-brand-accent/35 bg-white/80 px-3 py-2.5 text-[15px] file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-brand-primary file:px-3 file:py-1.5 file:text-sm file:text-white"
        />
        <p className="mt-1.5 text-xs text-brand-ink/45">
          仅支持 .xlsx，单文件不超过 5MB。首行将作为表头，最多解析 5000 行、60 列。
        </p>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-brand-primary/40 bg-brand-primary/5 px-3 py-2.5 text-sm text-brand-primary"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-brand-primary px-5 py-2.5 text-[15px] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '上传解析中…' : '上传并解析'}
      </button>
    </form>
  )
}
