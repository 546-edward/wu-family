import type { Metadata } from 'next'
import { getAlbums } from '@/lib/data'
import PhotoGrid from '@/components/PhotoGrid'

export const metadata: Metadata = {
  title: '相册',
  description: '家族影像资料，按相册分组展示，点击可查看大图。',
}

/** 相册页：按 Album 分组展示，交互全部封装在 PhotoGrid 内 */
export default function GalleryPage() {
  const albums = getAlbums()
  const totalPhotos = albums.reduce((sum, a) => sum + a.photos.length, 0)

  return (
    <div className="space-y-8">
      <header className="border-b border-brand-primary/20 pb-5">
        <h1 className="font-title text-3xl tracking-[0.2em] text-brand-primary md:text-4xl">
          相册
        </h1>
        <p className="mt-2 text-[15px] text-brand-ink/65">
          共 {albums.length} 组、{totalPhotos} 张图片。点击图片查看大图。
        </p>
      </header>

      <PhotoGrid albums={albums} />
    </div>
  )
}
