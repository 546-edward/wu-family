import type { Member } from '@/types'

/**
 * 成员详情卡片。
 * 只负责展示，不含任何交互状态；点击事件由世系树页面处理。
 */
export default function MemberDetail({ member }: { member: Member }) {
  const lifespan = formatLifespan(member)
  const rows: { label: string; value?: string }[] = [
    { label: '世代', value: `第 ${toChineseNumeral(member.generation)} 世` },
    { label: '房支', value: member.branch },
    { label: '性别', value: member.gender === 'M' ? '男' : '女' },
    { label: '生卒', value: lifespan },
    { label: '籍贯', value: member.hometown },
    { label: '配偶', value: member.spouseName },
    { label: '子嗣', value: formatChildren(member) },
  ]

  return (
    <article className="rounded-sm border border-brand-primary/30 bg-white/60 p-6">
      <header className="border-b border-brand-primary/20 pb-4">
        <h3 className="font-title text-3xl tracking-[0.15em] text-brand-primary">
          {member.name}
        </h3>
        <p className="mt-1.5 text-sm text-brand-ink/55">
          第 {toChineseNumeral(member.generation)} 世
          {member.branch ? ` · ${member.branch}` : ''}
        </p>
      </header>

      <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows
          .filter((r) => r.value)
          .map((r) => (
            <div key={r.label} className="flex gap-3 text-[15px]">
              <dt className="w-14 shrink-0 text-brand-ink/50">{r.label}</dt>
              <dd className="text-brand-ink/85">{r.value}</dd>
            </div>
          ))}
      </dl>

      {member.bio && (
        <div className="mt-6 border-t border-brand-primary/15 pt-4">
          <p className="mb-2 text-xs tracking-widest text-brand-ink/50">生平</p>
          <p className="prose-cn whitespace-pre-wrap-cn text-[15px] leading-8 text-brand-ink/80">
            {member.bio}
          </p>
        </div>
      )}

      <p className="mt-6 text-xs text-brand-ink/35">
        成员编号 {member.id}
      </p>
    </article>
  )
}

/** 生卒年格式化：仅有生年时只显示生年 */
function formatLifespan(member: Member): string | undefined {
  const { birthYear, deathYear } = member
  if (birthYear && deathYear) return `${birthYear} — ${deathYear}`
  if (birthYear) return `${birthYear} —`
  if (deathYear) return `— ${deathYear}`
  return undefined
}

/** 子嗣：列出直接子代姓名 */
function formatChildren(member: Member): string | undefined {
  const children = member.children ?? []
  if (children.length === 0) return undefined
  return children.map((c) => c.name).join('、')
}

/** 阿拉伯数字转中文数字（仅覆盖世系常用范围） */
function toChineseNumeral(n: number): string {
  const digits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  if (n < 10) return digits[n]
  if (n < 20) return `十${n % 10 === 0 ? '' : digits[n % 10]}`
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return `${digits[tens]}十${ones === 0 ? '' : digits[ones]}`
}
