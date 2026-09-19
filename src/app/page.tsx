import Link from 'next/link'
import { getAnnouncements, getFamilyConfig, getMilestones } from '@/lib/data'
import MilestoneTimeline from '@/components/MilestoneTimeline'

/**
 * 首页：首屏 → 家族简介 → 始祖与郡望 → 字辈诗 → 大事记 → 最新公告。
 * 全部内容经 `src/lib/data.ts` 取数。
 */
export default function HomePage() {
  const family = getFamilyConfig()
  const milestones = getMilestones()
  const latestAnnouncements = getAnnouncements().slice(0, 3)

  return (
    <div className="space-y-16 md:space-y-20">
      {/* 1. 首屏 */}
      <section className="border-y-2 border-brand-primary/70 py-12 text-center md:py-16">
        <p className="font-title text-sm tracking-[0.5em] text-brand-ink/55">
          {family.surname}氏
        </p>
        <h1 className="font-title mt-4 text-4xl font-semibold tracking-[0.15em] text-brand-primary md:text-6xl">
          {family.name}
        </h1>
        <p className="mt-5 text-sm tracking-[0.3em] text-brand-ink/65 md:text-base">
          堂号 {family.hallName}
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-8 text-brand-ink/75 md:text-base">
          {family.description.length > 90
            ? `${family.description.slice(0, 90)}……`
            : family.description}
        </p>
      </section>

      {/* 2. 家族简介 */}
      <Section title="家族简介">
        <div className="prose-cn max-w-3xl text-[15px] leading-8 text-brand-ink/80 md:text-base">
          <p>{family.description}</p>
        </div>
      </Section>

      {/* 3. 始祖与郡望 */}
      <Section title="始祖与郡望">
        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard label="始祖名讳" value={family.ancestor.name} />
          <InfoCard label="郡望 / 发源地" value={family.ancestor.origin} />
        </div>
        <div className="prose-cn mt-6 max-w-3xl text-[15px] leading-8 text-brand-ink/80 md:text-base">
          <p>{family.ancestor.brief}</p>
        </div>
      </Section>

      {/* 4. 字辈诗 */}
      <Section title="字辈诗">
        <blockquote className="border-x-2 border-brand-primary/40 px-6 py-8 text-center md:px-10">
          <p className="font-title whitespace-pre-wrap-cn text-xl leading-loose tracking-[0.25em] text-brand-primary md:text-2xl">
            {family.generationPoem}
          </p>
        </blockquote>
      </Section>

      {/* 5. 大事记 */}
      <Section title="大事记">
        <MilestoneTimeline milestones={milestones} />
      </Section>

      {/* 6. 最新公告 */}
      <Section
        title="最新公告"
        action={
          <Link
            href="/announcements"
            className="text-sm text-brand-primary underline-offset-4 hover:underline"
          >
            查看全部 →
          </Link>
        }
      >
        <ul className="divide-y divide-brand-primary/15 border-y border-brand-primary/15">
          {latestAnnouncements.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4">
              <time dateTime={a.publishedAt} className="text-sm text-brand-ink/50 tabular-nums">
                {a.publishedAt}
              </time>
              {a.isPinned && (
                <span className="rounded-sm border border-brand-primary/40 px-1.5 text-xs text-brand-primary">
                  置顶
                </span>
              )}
              <Link
                href="/announcements"
                className="flex-1 text-[15px] hover:text-brand-primary"
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
        {latestAnnouncements.length === 0 && (
          <p className="text-brand-ink/50">暂无公告。</p>
        )}
      </Section>
    </div>
  )
}

/** 统一的区块外壳：标题 + 内容，保持全站节奏一致 */
function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-brand-primary/20 pb-3">
        <h2 className="font-title text-2xl tracking-[0.2em] text-brand-primary md:text-[28px]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** 键值信息卡 */
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-brand-primary/25 bg-white/40 px-5 py-4">
      <p className="text-xs tracking-widest text-brand-ink/50">{label}</p>
      <p className="font-title mt-1.5 text-lg tracking-wider text-brand-ink">
        {value}
      </p>
    </div>
  )
}
