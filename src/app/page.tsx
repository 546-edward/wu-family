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
      <section className="relative border-y-2 border-brand-primary/70 py-12 text-center md:py-16">
        {/* 四角金色角饰，营造装裱感 */}
        <Corner className="left-0 top-0" />
        <Corner className="right-0 top-0 rotate-90" />
        <Corner className="bottom-0 right-0 rotate-180" />
        <Corner className="bottom-0 left-0 -rotate-90" />

        <p className="font-title text-sm tracking-[0.5em] text-brand-ink/55">
          {family.surname}氏
        </p>
        <h1 className="font-title mt-4 text-4xl font-semibold tracking-[0.15em] text-brand-primary md:text-6xl">
          {family.name}
        </h1>

        {/* 朱红印章式堂号 */}
        <p className="seal-tag mt-6 inline-block px-3 py-1 text-sm">
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
        <blockquote className="card-cn border-x-2 border-y-0 border-brand-primary/40 px-6 py-8 text-center md:px-10">
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
      <div className="mb-6 flex items-baseline justify-between gap-4 pb-3">
        <h2 className="font-title text-2xl tracking-[0.2em] text-brand-primary md:text-[28px]">
          {title}
        </h2>
        {action}
      </div>
      {/* 金—朱红—金 装饰分隔线，替代单调细线 */}
      <hr className="rule-festive mb-6" />
      {children}
    </section>
  )
}

/** 首屏四角的金色回纹角饰 */
function Corner({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      className={`pointer-events-none absolute h-8 w-8 text-brand-accent/70 md:h-10 md:w-10 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M1 14V1h13" />
      <path d="M6 14V6h8" />
      <circle cx="14" cy="14" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** 键值信息卡 */
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-cn card-cn-hover rounded-sm px-5 py-4">
      <p className="text-xs tracking-widest text-brand-ink/50">{label}</p>
      <p className="font-title mt-1.5 text-lg tracking-wider text-brand-ink">
        {value}
      </p>
    </div>
  )
}
