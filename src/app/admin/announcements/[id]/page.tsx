import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/guard'
import { getAnnouncement } from '@/lib/queries'
import AnnouncementForm from '../AnnouncementForm'

export const metadata = { title: '编辑公告' }

/** 编辑公告。id 由路径传入，需解码以兼容含特殊字符的编号。 */
export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()

  const { id } = await params
  const announcement = getAnnouncement(decodeURIComponent(id))
  if (!announcement) notFound()

  return (
    <div className="space-y-6">
      <h2 className="font-title text-xl tracking-wider text-brand-primary">
        编辑公告
      </h2>
      <AnnouncementForm announcement={announcement} />
    </div>
  )
}
