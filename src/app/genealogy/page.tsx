'use client'

import { useMemo, useState } from 'react'
import type { Member } from '@/types'
import { getMemberTree } from '@/lib/data'
import MemberNode from '@/components/MemberNode'
import MemberDetail from '@/components/MemberDetail'

/** 默认展开到第几代（含） */
const DEFAULT_EXPANDED_GENERATIONS = 2

/**
 * 世系树页面。
 *
 * 状态只有两个：
 * - `expanded`：已展开的节点 id 集合
 * - `selected`：当前查看详情的成员
 *
 * 初始展开集合在首次渲染时按世代计算，之后完全由用户点击驱动。
 */
export default function GenealogyPage() {
  const root = getMemberTree()

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    collectIdsUpToGeneration(root, DEFAULT_EXPANDED_GENERATIONS),
  )
  const [selected, setSelected] = useState<Member>(root)

  // 树在构建期即为常量，这里只是避免每次渲染重建统计信息
  const stats = useMemo(() => countMembers(root), [root])

  function handleToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => setExpanded(collectAllIds(root, true))
  const collapseAll = () => setExpanded(new Set([root.id]))

  return (
    <div className="space-y-6">
      <header className="border-b border-brand-primary/20 pb-5">
        <h1 className="font-title text-3xl tracking-[0.2em] text-brand-primary md:text-4xl">
          世系树
        </h1>
        <p className="mt-2 text-[15px] text-brand-ink/65">
          共 {stats.total} 位成员，分 {stats.generations} 世。
          点击节点查看详情，点击节点右侧 +/− 展开或收起子代。
        </p>
      </header>
      <hr className="rule-festive -mt-2" />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={expandAll}
          className="rounded-sm border border-brand-primary/40 px-3 py-1.5 text-sm text-brand-primary transition-colors hover:bg-brand-primary hover:text-brand-paper"
        >
          全部展开
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="rounded-sm border border-brand-primary/40 px-3 py-1.5 text-sm text-brand-primary transition-colors hover:bg-brand-primary hover:text-brand-paper"
        >
          全部收起
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* 树：横向可能超出，允许局部滚动，避免撑破页面 */}
        <section
          aria-label="家族世系树"
          className="card-cn overflow-x-auto rounded-sm p-6"
        >
          <ul className="flex list-none flex-col items-center">
            <MemberNode
              member={root}
              expanded={expanded}
              selectedId={selected.id}
              onToggle={handleToggle}
              onSelect={setSelected}
            />
          </ul>
        </section>

        {/* 详情：桌面端吸顶跟随，窄屏堆叠在树下 */}
        <aside className="lg:sticky lg:top-6" aria-label="成员详情">
          <MemberDetail member={selected} />
        </aside>
      </div>
    </div>
  )
}

/** 收集不超过指定世代的所有节点 id，用于「默认展开前两代」 */
function collectIdsUpToGeneration(root: Member, maxGeneration: number): Set<string> {
  const ids = new Set<string>()
  const walk = (node: Member) => {
    if (node.generation <= maxGeneration) {
      ids.add(node.id)
      for (const child of node.children ?? []) walk(child)
    }
  }
  walk(root)
  return ids
}

/** 收集树中全部节点 id（含根） */
function collectAllIds(root: Member, includeRoot = false): Set<string> {
  const ids = new Set<string>()
  const walk = (node: Member) => {
    if (includeRoot || node.id !== root.id) ids.add(node.id)
    for (const child of node.children ?? []) walk(child)
  }
  walk(root)
  return ids
}

/** 统计成员总数与世代数 */
function countMembers(root: Member): { total: number; generations: number } {
  let total = 0
  let generations = 0
  const walk = (node: Member) => {
    total += 1
    generations = Math.max(generations, node.generation)
    for (const child of node.children ?? []) walk(child)
  }
  walk(root)
  return { total, generations }
}
