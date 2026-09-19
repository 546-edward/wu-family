import { requireAuth } from '@/lib/guard'
import AnnouncementForm from '../AnnouncementForm'

export const metadata = { title: '新建公告' }

/** 新建公告 */
export default async function NewAnnouncementPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <h2 className="font-title text-xl tracking-wider text-brand-primary">
        新建公告
      </h2>
      <AnnouncementForm />
    </div>
  )
}
