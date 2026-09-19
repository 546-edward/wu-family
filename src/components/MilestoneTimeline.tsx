import type { Milestone } from '@/types'

/**
 * 大事记时间线：竖向排列，左侧为年份轴，右侧为事件。
 * 数据由调用方传入，组件本身不关心数据来源。
 */
export default function MilestoneTimeline({
  milestones,
}: {
  milestones: Milestone[]
}) {
  if (milestones.length === 0) {
    return <p className="text-brand-ink/50">暂无大事记记录。</p>
  }

  return (
    <ol className="relative ml-1 border-l border-brand-primary/30 pl-6 md:pl-8">
      {milestones.map((m) => (
        <li key={`${m.year}-${m.title}`} className="relative pb-8 last:pb-0">
          {/* 轴上的节点圆点 */}
          <span
            aria-hidden
            className="absolute -left-[31px] top-[0.55rem] h-2.5 w-2.5 rounded-full bg-brand-primary ring-4 ring-brand-paper md:-left-[39px]"
          />
          <p className="font-title text-xl tracking-widest text-brand-primary">
            {m.year}
          </p>
          <h3 className="mt-0.5 text-base font-medium">{m.title}</h3>
          {m.description && (
            <p className="mt-1 text-[15px] leading-7 text-brand-ink/70">
              {m.description}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
