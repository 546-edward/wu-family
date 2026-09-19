'use client'

import type { Member } from '@/types'

interface MemberNodeProps {
  member: Member
  /** 已展开的节点 id 集合 */
  expanded: Set<string>
  /** 当前选中的成员 id */
  selectedId: string
  /** 切换展开 / 收起 */
  onToggle: (id: string) => void
  /** 选中成员以查看详情 */
  onSelect: (member: Member) => void
  /** 当前递归深度，用于连线层级样式 */
  depth?: number
}

/**
 * 世系树递归节点。
 *
 * 渲染结构（每层为横向排列，用 CSS 伪元素画连线）：
 *
 *            父节点
 *              │
 *        ┌─────┴─────┐
 *      子节点      子节点
 *
 * 去重由数据结构保证：`Member` 为树形嵌套，每位成员在树中只出现一次，
 * 因此递归渲染不会产生重复节点。同时以 `member.id` 作为 key。
 */
export default function MemberNode({
  member,
  expanded,
  selectedId,
  onToggle,
  onSelect,
  depth = 0,
}: MemberNodeProps) {
  const children = member.children ?? []
  const hasChildren = children.length > 0
  const isExpanded = expanded.has(member.id)
  const isSelected = selectedId === member.id

  return (
    <li className="relative flex flex-col items-center">
      {/* 指向本节点的竖线（根节点不需要） */}
      {depth > 0 && (
        <span
          aria-hidden
          className="h-4 w-px bg-brand-ink/35"
        />
      )}

      {/* 节点卡片 */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => onSelect(member)}
          aria-pressed={isSelected}
          className={
            'font-title min-w-[6.5rem] rounded-sm border px-3 py-2 text-center text-[15px] tracking-wider shadow-sm transition-all ' +
            (isSelected
              ? 'border-brand-primary bg-brand-primary text-brand-paper'
              : 'border-brand-primary/35 bg-brand-paper text-brand-ink hover:border-brand-primary hover:text-brand-primary')
          }
        >
          <span className="block whitespace-nowrap">{member.name}</span>
          <span
            className={
              'mt-0.5 block text-[11px] tracking-normal ' +
              (isSelected ? 'text-brand-paper/75' : 'text-brand-ink/45')
            }
          >
            第{member.generation}世
            {member.branch ? ` · ${member.branch}` : ''}
          </span>
        </button>

        {/* 折叠按钮：仅有子代时出现 */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => onToggle(member.id)}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? `收起 ${member.name} 的子代`
                : `展开 ${member.name} 的子代（${children.length} 人）`
            }
            className={
              'absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 translate-x-full items-center justify-center rounded-full border border-brand-primary/40 bg-brand-paper text-xs leading-none text-brand-primary transition-colors hover:bg-brand-primary hover:text-brand-paper'
            }
          >
            <span aria-hidden>{isExpanded ? '−' : '+'}</span>
          </button>
        )}
      </div>

      {/* 子代：递归渲染 */}
      {hasChildren && isExpanded && (
        <ul className="member-children mt-0 flex list-none flex-row items-start pt-4">
          {children.map((child) => (
            <MemberNode
              key={child.id}
              member={child}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
