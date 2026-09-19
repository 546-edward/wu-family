'use client'

import { useEffect, useRef, useState } from 'react'
import type { Album } from '@/types'

interface Photo {
  url: string
  caption?: string
}

/**
 * 相册网格与大图查看。
 *
 * 大图使用浏览器原生 `<dialog>` + `showModal()`，不引入灯箱库。
 * 使用原生 <img> 而非 next/image：本站为静态导出，未启用图片优化服务。
 */
export default function PhotoGrid({ albums }: { albums: Album[] }) {
  const [active, setActive] = useState<Photo | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // 选中图片时打开 modal，取消选中时关闭
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (active && !dialog.open) dialog.showModal()
    if (!active && dialog.open) dialog.close()
  }, [active])

  if (albums.length === 0) {
    return <p className="text-brand-ink/50">暂无相册。</p>
  }

  return (
    <>
      <div className="space-y-14">
        {albums.map((album) => (
          <section key={album.id}>
            <header className="mb-4 border-b border-brand-primary/20 pb-3">
              <h2 className="font-title text-2xl tracking-[0.15em] text-brand-primary">
                {album.title}
              </h2>
              {album.description && (
                <p className="mt-1.5 text-[15px] text-brand-ink/65">
                  {album.description}
                </p>
              )}
            </header>

            {/* 桌面 4 列，窄屏自适应 */}
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {album.photos.map((photo) => (
                <li key={photo.url}>
                  <button
                    type="button"
                    onClick={() => setActive(photo)}
                    className="group block w-full overflow-hidden rounded-sm border border-brand-primary/25 bg-white/40 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <span className="block aspect-[3/2] overflow-hidden bg-brand-paper">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption ?? album.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </span>
                    {photo.caption && (
                      <span className="block px-2.5 py-2 text-left text-[13px] text-brand-ink/70">
                        {photo.caption}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* 原生 dialog 大图查看 */}
      <dialog
        ref={dialogRef}
        onClose={() => setActive(null)}
        onClick={(e) => {
          // 点击遮罩区域关闭（点击内容本身不关闭）
          if (e.target === e.currentTarget) setActive(null)
        }}
        className="m-auto max-h-[92vh] w-auto max-w-[92vw] rounded-sm border border-brand-primary/30 bg-brand-paper p-3 backdrop:bg-black/70 open:block"
      >
        {active && (
          <figure className="flex max-h-[86vh] flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption ?? '相册大图'}
              className="max-h-[74vh] w-auto max-w-full rounded-sm object-contain"
            />
            <figcaption className="mt-3 flex items-center gap-4 text-sm text-brand-ink/75">
              <span>{active.caption ?? '未命名图片'}</span>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-sm border border-brand-primary/40 px-2.5 py-1 text-xs text-brand-primary transition-colors hover:bg-brand-primary hover:text-brand-paper"
              >
                关闭
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  )
}
